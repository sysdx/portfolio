"use client";
import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "@/lib/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, null);
  return (
    <form action={action} className="contact-form">
      <label>Name<input type="text" name="name" required autoComplete="name" /></label>
      <label>Email<input type="email" name="email" required autoComplete="email" /></label>
      <label>Message<textarea name="body" required rows={6} /></label>
      <label className="hp" aria-hidden="true">Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      <div className="form actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Sending…" : "Send message"}</button></div>
      {state && <p role="status" className={`form-msg ${state.ok ? "ok" : "err"}`}>{state.message}</p>}
    </form>
  );
}
