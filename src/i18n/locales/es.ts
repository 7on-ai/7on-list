import type { Dictionary } from "../types";

export const es: Dictionary = {
  meta: {
    title: "7on ARC — Ten tu Sunday antes que nadie",
    description: "7on ARC, IA siempre contigo. Recibe la ficha técnica preliminar del hogar de Sunday, el agente de IA siempre activo.",
    ogLine: "Sunday vive en 7on ARC.",
  },
  hero: {
    headline: ["Ten tu Sunday", "antes que nadie."],
    sub: "Una IA privada que vive en 7on ARC, una máquina solo tuya, y se encarga de todo mientras tú vives tu día.",
    placeholder: "Tu email",
    cta: "Recibe la ficha de 7on ARC",
    note: "Sin spam. La ficha técnica ahora, y un solo email más cuando tu 7on ARC esté listo.",
  },
  form: {
    success: "Estás dentro. La ficha técnica va de camino a tu correo.",
    invalid: "Ese email no parece correcto.",
    required: "Escribe tu email.",
    error: "Algo salió mal. Inténtalo de nuevo.",
    sending: "Enviando…",
    emailLabel: "Correo electrónico",
  },
  orbit: {
    headline: ["Un solo agente.", "Todo lo que te rodea."],
    sub: "Llamadas, correo, calendario, hogar, dinero: todo desde un solo lugar.",
  },
  day: {
    eyebrow: "Tu primer día",
    headline: "El día que llega tu 7on ARC",
    moments: [
      {
        time: "07:00",
        tag: "Primera luz",
        title: "La mañana, resuelta",
        line: "Buenos días. 24° y despejado, y tu reunión de las 9:00 pasó a las 10:00.",
      },
      {
        time: "11:30",
        tag: "Mientras trabajas",
        title: "Bandeja, al día",
        line: "Respondí los tres que solo necesitaban un sí. Dos te necesitan a ti: están fijados.",
      },
      {
        time: "16:45",
        tag: "En camino",
        title: "El recado, hecho",
        line: "Tu paquete llega mañana. Ya está en tu calendario.",
      },
      {
        time: "22:10",
        tag: "Luces fuera",
        title: "La casa, dormida",
        line: "Puertas cerradas, luces apagadas, alarma a las 6:30. Buenas noches.",
      },
    ],
  },
  machine: {
    tagline: "IA siempre contigo",
    headline: ["Verdaderamente", "tuyo."],
    body: "Sunday te conoce. Nadie más. Tus datos nunca entrenan el modelo de nadie.",
    cta: "Recibe la ficha de 7on ARC",
  },
  prefs: {
    title: "Preferencias de email",
    /* {email} is replaced with the address */
    intro: "Elige qué enviamos a {email}.",
    options: {
      updates: { label: "Novedades", description: "Noticias ocasionales sobre Sunday y 7on ARC, y el email cuando tu 7on ARC esté listo." },
      launch: { label: "Solo el lanzamiento", description: "Un email cuando tu 7on ARC esté listo. Nada más." },
      none: { label: "Nada", description: "Ningún email más de 7on." },
    },
    current: "Actual",
    choose: "Elegir",
    confirm: "Sí, mantenme al día",
    saved: "Guardado.",
    invalid: "Este enlace no funciona. Usa el enlace de tu email más reciente de 7on.",
    back: "Volver a 7on ARC",
  },
  invite: {
    invited: "Un amigo te invitó",
    title: "¿Lo quieres antes?",
    body: "Cada amigo que reciba la ficha técnica con tu enlace te hace avanzar en la fila.",
    copy: "Copiar enlace",
    copied: "Copiado",
    share: "Compartir",
    shareText: "Sunday vive en 7on ARC. Recibe la ficha técnica:",
    pageTitle: "Tu lugar en la fila",
    place: "Tu lugar",
    friends: "Amigos que se unieron",
    how: "Cuando 7on ARC esté listo, escribiremos en el orden de la fila. Un amigo cuenta en cuanto le llega su ficha técnica.",
    out: "Esta dirección tiene desactivados los emails de 7on, así que no está en la fila.",
    manage: "Preferencias de email",
  },
  footer: "Hecho para no apagarse.",
};
