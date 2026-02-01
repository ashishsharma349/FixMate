function HeaderContainer({children}){
return <>
<div className="w-full h-16 flex items-center justify-start px-6 bg-white shadow-sm sticky top-0 z-50 ">
    {children}
</div>    
</>

}

export default HeaderContainer;
