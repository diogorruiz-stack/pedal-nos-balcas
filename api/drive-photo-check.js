module.exports=async function handler(req,res){
 try{
  const url='https://drive.google.com/uc?export=download&id=1joPtH33vFqG4VNipm8eRDnXxAWelPeea';
  const r=await fetch(url,{redirect:'follow'});
  const ab=await r.arrayBuffer();
  res.status(200).json({ok:r.ok,status:r.status,contentType:r.headers.get('content-type'),bytes:ab.byteLength,finalUrl:r.url});
 }catch(e){res.status(500).json({ok:false,error:String(e)})}
};