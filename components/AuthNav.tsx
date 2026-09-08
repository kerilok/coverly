"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {LogIn,LogOut} from "lucide-react";
import {createClient} from "@/lib/supabase/client";
import type {User} from "@supabase/supabase-js";
export function AuthNav(){
 const supabase=createClient();const[user,setUser]=useState<User|null>(null);
 useEffect(()=>{if(!supabase)return;supabase.auth.getUser().then(({data})=>setUser(data.user));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,u)=>setUser(u));return()=>subscription.unsubscribe()},[supabase]);
 if(!supabase)return <Link href="/signup" className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-plum to-pink-400 text-xs font-bold text-white">Я</Link>;
 if(!user)return <Link href="/login" className="flex h-11 items-center gap-2 rounded-xl border line px-3 text-sm font-semibold"><LogIn size={16}/><span className="hidden sm:inline">Войти</span></Link>;
 const name=(user.user_metadata?.username||user.email||"Я") as string;const initials=name.slice(0,2).toUpperCase();
 return <div className="flex items-center gap-2"><Link href="/account" title={name} className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-plum to-pink-400 text-xs font-bold text-white">{initials}</Link><button title="Выйти" onClick={async()=>{await supabase.auth.signOut();location.href="/"}} className="grid h-11 w-11 place-items-center rounded-xl border line"><LogOut size={16}/></button></div>
}