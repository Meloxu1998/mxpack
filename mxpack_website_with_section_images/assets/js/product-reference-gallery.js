(() => {
  const data=document.querySelector('[data-reference-data]');
  const image=document.querySelector('[data-gallery-main]');
  if(!data||!image)return;
  const views=JSON.parse(data.textContent);
  const buttons=[...document.querySelectorAll('[data-reference-id]')];
  const productName=document.querySelector('h1').textContent.trim();
  const select=id=>{
    const view=views.find(item=>item.id===id);if(!view)return;
    image.src=view.image;
    image.srcset=`${view.image} ${view.width}w`;
    image.width=view.width;image.height=view.height;
    image.alt=`${productName}: ${view.label.toLowerCase()} reference`;
    document.querySelector('[data-reference-note]').textContent=view.note;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.referenceId===id)));
    document.querySelectorAll('main a[href*="get-a-quote"]').forEach(link=>{
      const target=window.mxpackUrlState?window.mxpackUrlState.write(link.href,{view:id}):new URL(link.href);
      if(!window.mxpackUrlState)target.searchParams.set('view',id);
      link.href=target.href;
    });
    document.querySelectorAll('[data-whatsapp]').forEach(link=>{
      const target=new URL(link.href);
      target.searchParams.set('text',`Hi MXPACKPRO, I am interested in ${productName}.\nReference view: ${view.label}\nPage: https://mxpackpro.com${location.pathname}`);
      link.href=target.href;
    });
  };
  buttons.forEach(button=>button.addEventListener('click',()=>{
    select(button.dataset.referenceId);
    window.mxpackTrack?.('product_reference_select',{reference_id:button.dataset.referenceId});
  }));
  select(views[0].id);
})();
