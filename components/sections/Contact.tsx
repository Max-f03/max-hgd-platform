"use client";

import { useState } from "react";
import Select from "@/components/ui/Select";
import Reveal from "@/components/ui/Reveal";

type ProjectType = "" | "ux-ui" | "frontend" | "branding" | "autre";

interface FormState {
  name: string;
  email: string;
  projectType: ProjectType;
  message: string;
}

const projectTypeOptions = [
  { value: "ux-ui", label: "UX/UI Design" },
  { value: "frontend", label: "Frontend Development" },
  { value: "branding", label: "Branding / Logo" },
  { value: "autre", label: "Autre" },
];

const contactInfo = [
  {
    label: "Email",
    value: "contact@maxhgd.design",
    bg: "#DBEAFE",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: "Localisation",
    value: "Cotonou, Benin",
    bg: "#E0E7FF",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3730A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: "Disponibilite",
    value: "Disponible pour freelance",
    valueColor: "#2563EB",
    bg: "#DBEAFE",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const socialLinks = [
  {
    label: "in",
    href: "https://www.linkedin.com/in/max-hgd",
    isText: true,
  },
  {
    label: "GitHub",
    href: "https://github.com/max-hgd",
    isText: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  },
  {
    label: "Dribbble",
    href: "https://dribbble.com/maxhgd",
    isText: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
      </svg>
    ),
  },
];

const inputClass =
  "w-full px-3.5 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white";

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    projectType: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setSubmitError("Impossible d'envoyer le message pour le moment.");
        return;
      }

      const data = (await response.json()) as { emailSent?: boolean };
      setEmailSent(Boolean(data.emailSent));
      setSubmitted(true);
    } catch {
      setSubmitError("Impossible d'envoyer le message pour le moment.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="py-16 lg:py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <Reveal>
          <div className="flex flex-col gap-3 text-center">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium tracking-widest uppercase">
                Contact
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium text-neutral-900">
              Un projet, une idee ?
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto text-sm leading-relaxed">
              Discutons-en autour d&apos;un cafe (virtuel ou reel)
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Reveal variant="left" delay={100}>
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center lg:col-span-2">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900">Message envoye !</h3>
              <p className="text-sm text-neutral-500">
                Merci pour votre message. Je vous repondrai dans les plus brefs delais.
              </p>
              {emailSent === false && (
                <p className="text-xs text-amber-600">
                  Message enregistre. L'envoi email n'est pas configure pour le moment.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmailSent(null);
                  setSubmitError("");
                  setForm({ name: "", email: "", projectType: "", message: "" });
                }}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors duration-200"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Nom complet</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <Select
                label="Type de projet"
                placeholder="Choisir une option"
                options={projectTypeOptions}
                value={form.projectType}
                onChange={(val) => setForm((p) => ({ ...p, projectType: val as ProjectType }))}
              />
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Decrivez votre projet..."
                  rows={4}
                  required
                  className={`${inputClass} resize-y min-h-[100px]`}
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 rounded-xl text-sm font-medium transition-colors duration-200"
              >
                {isSending ? "Envoi en cours..." : "Envoyer le message"}
              </button>
              {submitError ? <p className="text-xs text-red-600">{submitError}</p> : null}
            </form>
          )}
          </Reveal>

          <Reveal variant="right" delay={200}>
          <div className="flex flex-col gap-4">
            <div className="bg-neutral-50 rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-medium text-neutral-900">Informations</h3>
              <div className="flex flex-col gap-3">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: info.bg }}
                    >
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">{info.label}</p>
                      <p
                        className="text-xs font-medium"
                        style={{ color: info.valueColor ?? "#111827" }}
                      >
                        {info.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="text-sm font-medium text-neutral-900">Retrouvez-moi sur</h3>
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors duration-200 text-sm font-semibold"
                  >
                    {social.isText ? social.label : social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
