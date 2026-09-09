"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, MessageCircle, Reply } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "./I18nProvider";

type Notice={id:string;type:"comment"|"reply";bookId:string;actor:string;book:string;read:boolean;createdAt:string};
const labels={
  ru:{title:"Уведомления",empty:"Новых уведомлений нет",all:"Прочитать все",comment:"оставил комментарий к",reply:"ответил на ваш комментарий к"},
  en:{title:"Notifications",empty:"No new notifications",all:"Mark all read",comment:"commented on",reply:"replied to your comment on"},
  de:{title:"Benachrichtigungen",empty:"Keine neuen Benachrichtigungen",all:"Alle gelesen",comment:"kommentierte",reply:"antwortete auf deinen Kommentar zu"},
  uk:{title:"Сповіщення",empty:"Нових сповіщень немає",all:"Прочитати все",comment:"залишив коментар до",reply:"відповів на ваш коментар до"}
};

export function NotificationBell(){
  const supabase=useMemo(()=>createClient(),[]),router=useRouter(),{locale}=useI18n();
  const [open,setOpen]=useState(false),[items,setItems]=useState<Notice[]>([]),[ready,setReady]=useState(false);
  const box=useRef<HTMLDivElement>(null),text=labels[locale];
  const load=useCallback(async()=>{
    if(!supabase)return setReady(true);
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){setItems([]);setReady(true);return}
    const{data}=await supabase.from("notifications").select("id,type,book_id,actor_id,is_read,created_at").order("created_at",{ascending:false}).limit(30);
    const rows=(data||[])as any[];
    const actorIds=[...new Set(rows.map(row=>row.actor_id))],bookIds=[...new Set(rows.map(row=>row.book_id))];
    const[{data:actors},{data:books}]=await Promise.all([
      actorIds.length?supabase.from("users").select("id,username").in("id",actorIds):Promise.resolve({data:[]}),
      bookIds.length?supabase.from("books").select("id,title").in("id",bookIds):Promise.resolve({data:[]})
    ]);
    const names=new Map((actors||[]).map((x:any)=>[x.id,x.username])),titles=new Map((books||[]).map((x:any)=>[x.id,x.title]));
    setItems(rows.map(row=>({id:row.id,type:row.type,bookId:row.book_id,actor:names.get(row.actor_id)||"User",book:titles.get(row.book_id)||"Cover",read:Boolean(row.is_read),createdAt:new Date(row.created_at).toLocaleString()})));
    setReady(true);
  },[supabase]);
  useEffect(()=>{load();const timer=setInterval(load,15000);const close=(event:MouseEvent)=>{if(!box.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("mousedown",close);return()=>{clearInterval(timer);document.removeEventListener("mousedown",close)}},[load]);
  const unread=items.filter(item=>!item.read).length;
  async function visit(item:Notice){if(supabase&&!item.read)await supabase.from("notifications").update({is_read:true}).eq("id",item.id);setItems(current=>current.map(x=>x.id===item.id?{...x,read:true}:x));setOpen(false);router.push(`/books/${item.bookId}`)}
  async function readAll(){if(!supabase)return;await supabase.from("notifications").update({is_read:true}).eq("is_read",false);setItems(current=>current.map(x=>({...x,read:true})))}
  if(!ready)return <div className="hidden h-11 w-11 sm:block"/>;
  return <div ref={box} className="relative">
    <button onClick={()=>{setOpen(value=>!value);if(!open)load()}} aria-label={text.title} className="relative grid h-11 w-11 place-items-center rounded-xl border line">
      <Bell size={18}/>{unread>0&&<span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread>99?"99+":unread}</span>}
    </button>
    {open&&<div className="fixed left-2 right-2 top-[68px] z-50 max-h-[70dvh] overflow-hidden rounded-2xl border border-white/15 bg-neutral-950 text-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
      <div className="flex items-center justify-between border-b border-white/10 p-4"><b>{text.title}</b>{unread>0&&<button onClick={readAll} className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"><CheckCheck size={15}/>{text.all}</button>}</div>
      <div className="max-h-[58dvh] overflow-y-auto p-2">{items.length===0?<p className="p-8 text-center text-sm text-white/55">{text.empty}</p>:items.map(item=><button key={item.id} onClick={()=>visit(item)} className={`mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-white/10 ${item.read?"opacity-60":"bg-white/[.06]"}`}>
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10">{item.type==="reply"?<Reply size={16}/>:<MessageCircle size={16}/>}</span>
        <span className="min-w-0 text-sm"><b>{item.actor}</b> {item.type==="reply"?text.reply:text.comment} <b>{item.book}</b><small className="mt-1 block text-white/45">{item.createdAt}</small></span>
        {!item.read&&<i className="mt-2 h-2 w-2 shrink-0 rounded-full bg-acid"/>}
      </button>)}</div>
    </div>}
  </div>
}
