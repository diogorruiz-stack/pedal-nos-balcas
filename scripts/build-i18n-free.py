import json,re,html,pathlib
import argostranslate.package
import argostranslate.translate
ROOT=pathlib.Path(__file__).resolve().parent.parent
DIR=ROOT/'i18n'
src=json.loads((DIR/'pt-BR.json').read_text(encoding='utf-8'))
argostranslate.package.update_package_index()
packages=argostranslate.package.get_available_packages()
for dest in ('en','es'):
    direct=next((p for p in packages if p.from_code=='pt' and p.to_code==dest),None)
    if direct: wanted=[direct]
    else:
        pt_en=next((p for p in packages if p.from_code=='pt' and p.to_code=='en'),None)
        en_es=next((p for p in packages if p.from_code=='en' and p.to_code=='es'),None)
        if not pt_en or not en_es: raise RuntimeError('No free models for pt -> '+dest)
        wanted=[pt_en,en_es]
    for p in wanted:
        installed=argostranslate.translate.get_installed_languages()
        existing=next((x for x in installed if x.code==p.from_code),None)
        if existing is None or not any(t.to_lang.code==p.to_code for t in existing.translations_from):
            argostranslate.package.install_from_path(p.download())
fallbacks=[]
def translate_string(value,dest):
    if not value.strip():return value
    pieces=re.split(r'(<[^>]*>)',value)
    out=[]
    for p in pieces:
        if p.startswith('<') and p.endswith('>'):out.append(p)
        elif p.strip():
            # Preserve HTML entities such as &nbsp; while translating visible text.
            translated=argostranslate.translate.translate(html.unescape(p),'pt',dest)
            if not translated.strip():
                # Retry using a shorter input; do not silently drop diary content.
                chunks=re.split(r'(?<=[.!?])\\s+',html.unescape(p))
                translated=' '.join(argostranslate.translate.translate(c,'pt',dest) for c in chunks).strip()
            if not translated.strip():
                fallbacks.append({'language':dest,'original':p[:150]})
                translated=p
            out.append(html.escape(translated,quote=False) if '<' in translated or '>' in translated else translated)
        else:out.append(p)
    return ''.join(out)
def walk(o,dest,key=None):
    if isinstance(o,list):return [walk(x,dest,key) for x in o]
    if isinstance(o,dict):return {k:walk(v,dest,k) for k,v in o.items()}
    if isinstance(o,str):
        if key in ('id','language','source'):return o
        return translate_string(o,dest)
    return o
for dest in ('en','es'):
    output={'version':1,'days':[]}
    for day in src['days']:
        output['days'].append(walk(day,dest))
        print(dest,'day',day['day'],'complete',flush=True)
    print(dest,'untranslated fallback segments:',len([x for x in fallbacks if x['language']==dest]),flush=True)
    (DIR/(dest+'.json')).write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

(DIR/'translation-fallbacks.json').write_text(json.dumps(fallbacks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
