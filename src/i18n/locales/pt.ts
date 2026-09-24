import type { Dictionary } from "../types";

export const pt: Dictionary = {
  meta: {
    title: "7on ARC — Seu Sunday, antes de todo mundo",
    description: "Receba a ficha técnica preliminar do 7on ARC, a casa do Sunday, o agente de IA sempre ligado.",
  },
  hero: {
    headline: ["Seu Sunday,", "antes de todo mundo."],
    sub: "Uma IA privada que vive no 7on ARC, uma máquina só sua, e resolve as coisas enquanto você vive o seu dia.",
    placeholder: "Seu e-mail",
    cta: "Receber a ficha do 7on ARC",
    note: "Sem spam. A ficha técnica agora, e só mais um e-mail quando seu 7on ARC estiver pronto.",
  },
  form: {
    success: "Pronto. A ficha técnica está a caminho do seu e-mail.",
    invalid: "Esse e-mail não parece correto.",
    required: "Digite seu e-mail.",
    error: "Algo deu errado. Tente novamente.",
    sending: "Enviando…",
    emailLabel: "Endereço de e-mail",
  },
  orbit: {
    headline: ["Um só agente.", "Tudo ao seu redor."],
    sub: "Chamadas, e-mails, agenda, casa, dinheiro — tudo em um só lugar.",
  },
  day: {
    eyebrow: "Seu primeiro dia",
    headline: "O dia em que seu 7on ARC chega",
    moments: [
      {
        time: "07:00",
        tag: "Primeira luz",
        title: "Manhã, resolvida",
        line: "Bom dia. 24° e céu limpo, e sua reunião das 9h foi para as 10h.",
      },
      {
        time: "11:30",
        tag: "Enquanto você trabalha",
        title: "Caixa de entrada, zerada",
        line: "Respondi os três que só precisavam de um sim. Dois precisam de você — estão fixados.",
      },
      {
        time: "16:45",
        tag: "A caminho",
        title: "Tarefa, feita",
        line: "Sua encomenda foi remarcada para amanhã. Já está na sua agenda.",
      },
      {
        time: "22:10",
        tag: "Luzes apagadas",
        title: "A casa, dormindo",
        line: "Portas trancadas, luzes apagadas, alarme às 6h30. Boa noite.",
      },
    ],
  },
  machine: {
    headline: ["Verdadeiramente", "seu."],
    body: "O Sunday aprende sobre você. Mais ninguém. Seus dados nunca treinam o modelo de ninguém.",
    cta: "Receber a ficha do 7on ARC",
  },
  prefs: {
    title: "Preferências de e-mail",
    /* {email} is replaced with the address */
    intro: "Escolha o que enviamos para {email}.",
    options: {
      updates: { label: "Novidades", description: "Notícias ocasionais sobre o Sunday e o 7on ARC, e o e-mail quando seu 7on ARC estiver pronto." },
      launch: { label: "Só o lançamento", description: "Um e-mail quando seu 7on ARC estiver pronto. Nada mais." },
      none: { label: "Nada", description: "Nenhum e-mail a mais da 7on." },
    },
    current: "Atual",
    choose: "Escolher",
    confirm: "Sim, quero novidades",
    saved: "Salvo.",
    invalid: "Este link não funciona. Use o link do seu e-mail mais recente da 7on.",
    back: "Voltar ao 7on ARC",
  },
  invite: {
    title: "Quer o seu antes?",
    body: "Cada amigo que receber a ficha técnica pelo seu link faz você avançar na fila.",
    copy: "Copiar link",
    copied: "Copiado",
    share: "Compartilhar",
    shareText: "Sunday vive no 7on ARC. Receba a ficha técnica:",
    pageTitle: "Seu lugar na fila",
    place: "Seu lugar",
    friends: "Amigos que entraram",
    how: "Quando o 7on ARC estiver pronto, vamos escrever na ordem da fila. Um amigo conta assim que a ficha técnica chegar para ele.",
    out: "Os e-mails da 7on estão desativados para este endereço, então ele não está na fila.",
    manage: "Preferências de e-mail",
  },
  footer: "Feito para ficar ligado.",
};
