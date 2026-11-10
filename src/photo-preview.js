const maxBytes=5*1024*1024,maxPhotos=4,maxPixels=20_000_000;
const urls=new Set();let epoch=0;
export function clearPhotoPreviewState(){epoch++;for(const url of urls)URL.revokeObjectURL(url);urls.clear();}
function node(tag,text,className){const item=document.createElement(tag);if(text)item.textContent=text;if(className)item.className=className;return item;}
function release(url){URL.revokeObjectURL(url);urls.delete(url);}
export function photoFileError(file,header){
  if(!file.size||file.size>maxBytes)return 'Use a nonempty image no larger than 5 MB.';
  const bytes=[...header];
  const png=[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!({ 'image/png':png,'image/jpeg':jpeg,'image/webp':webp }[file.type]))return 'Choose a JPEG, PNG or WebP with matching image content. SVG and other files are not supported.';
  return '';
}
export function renderPhotoPreview(container,navigate){
  clearPhotoPreviewState();container.replaceChildren();const version=epoch;
  const root=node('section',null,'photo-preview');let photos=[],counter=0,busy=false;
  const current=()=>version===epoch&&root.parentNode===container;
  const back=node('a','← Back to provider setup','profile-back');back.href='?page=provider-setup';back.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate('provider-setup');});
  root.append(back,node('p','PHOTO WORKSPACE PREVIEW','eyebrow'),node('h1','Find your first impression.'),node('p','Try test photos on this device. Nothing is uploaded, saved to your account or assigned to your profile. Leaving or reloading clears the workspace.','editor-notice'));
  const label=node('label','Choose test photos');label.htmlFor='photo-preview-files';const input=node('input');input.id=label.htmlFor;input.type='file';input.multiple=true;input.accept='image/jpeg,image/png,image/webp';
  const hint=node('p','Local preview limits: up to 4 photos, 5 MB each and 20 megapixels. JPEG, PNG or WebP only. These are prototype limits, not publishing allowances.','profile-small');hint.id='photo-preview-hint';input.setAttribute('aria-describedby',hint.id);
  const reset=node('button','Clear photo workspace','button quiet');reset.type='button';reset.disabled=true;
  const status=node('p','','profile-small');status.setAttribute('role','status');status.tabIndex=-1;
  const errors=node('p','','editor-errors');errors.setAttribute('role','alert');
  const preview=node('section',null,'photo-main-preview');const gallery=node('div',null,'photo-preview-grid');gallery.setAttribute('aria-label','Local test photos');
  root.append(label,input,hint,reset,status,errors,preview,gallery);container.append(root);
  function paint(){
    preview.replaceChildren();gallery.replaceChildren();reset.disabled=busy||!photos.length;
    if(!photos.length){preview.append(node('h2','Your local photo preview'),node('p','Choose test photos to compare a main image and their order.','profile-small'));return;}
    preview.append(node('h2','Main photo layout preview'));
    const main=node('img');main.src=photos[0].url;main.alt=`Photo ${photos[0].number} selected for local main preview`;preview.append(main,node('p','Local preview only · saved profile unchanged','profile-small'));
    photos.forEach((photo,index)=>{
      const card=node('article',null,'photo-preview-card');const image=node('img');image.src=photo.url;image.alt=`Local test photo ${photo.number}`;
      const select=node('button',index===0?'Main preview':`Use photo ${photo.number} as main preview`,'button outline');select.type='button';select.setAttribute('aria-pressed',String(index===0));select.disabled=busy||index===0;
      select.addEventListener('click',()=>{if(busy)return;photos=[photo,...photos.filter(value=>value!==photo)];paint();status.textContent=`Photo ${photo.number} is first in the local preview. Saved profile unchanged.`;status.focus();});
      const earlier=node('button',`Move photo ${photo.number} earlier`,'button quiet');earlier.type='button';earlier.disabled=busy||index===0;
      earlier.addEventListener('click',()=>{if(busy||index===0)return;[photos[index-1],photos[index]]=[photos[index],photos[index-1]];paint();status.textContent=`Photo ${photo.number} moved to position ${index}.`;status.focus();});
      const remove=node('button',`Remove photo ${photo.number}`,'button quiet');remove.type='button';remove.disabled=busy;
      remove.addEventListener('click',()=>{if(busy)return;release(photo.url);photos=photos.filter(value=>value!==photo);paint();status.textContent=`Photo ${photo.number} removed from this device preview.`;status.focus();});
      card.append(image,node('h3',`Photo ${photo.number}`),node('p',`Position ${index+1} · ${photo.width} × ${photo.height}`,'profile-small'),select,earlier,remove);gallery.append(card);
    });
  }
  input.addEventListener('change',async()=>{
    if(busy)return;const files=[...input.files];if(!files.length)return;errors.textContent='';
    if(files.length+photos.length>maxPhotos){errors.textContent='This local workspace holds up to 4 photos. Remove one before adding more.';input.value='';return;}
    busy=true;input.disabled=true;paint();status.textContent='Checking local images…';const rejected=[];
    for(const file of files){
      let url=null;
      try{
        const error=photoFileError(file,new Uint8Array(await file.slice(0,12).arrayBuffer()));if(error)throw new Error(error);
        if(!current())return;
        url=URL.createObjectURL(file);urls.add(url);const image=new Image();image.src=url;await image.decode();
        if(!current()){release(url);return;}
        if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>maxPixels)throw new Error('Use an image no larger than 20 megapixels.');
        photos.push({url,width:image.naturalWidth,height:image.naturalHeight,number:++counter});url=null;
      }catch(error){if(url)release(url);if(current())rejected.push(error instanceof DOMException?'This image could not be opened. Choose another test image.':error.message);}
    }
    if(!current())return;busy=false;input.disabled=false;input.value='';paint();errors.textContent=[...new Set(rejected)].join(' ');status.textContent=`${photos.length} local ${photos.length===1?'photo':'photos'} in this workspace. Nothing uploaded.`;status.focus();
  });
  reset.addEventListener('click',()=>{if(busy||!photos.length||!window.confirm('Clear all local test photos? Nothing has been uploaded or saved.'))return;for(const photo of photos)release(photo.url);photos=[];input.value='';errors.textContent='';paint();status.textContent='Local photo workspace cleared.';input.focus();});
  paint();
}
