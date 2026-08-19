export type Task = { id: string; title: string; subject: string; dueDate: string; priority: "Baixa" | "Média" | "Alta"; completed: boolean };
export type Flashcard = { id: string; question: string; answer: string; subject: string; mastered: boolean };
export type Team = { id: string; name: string; subject: string; members: string[]; nextMeeting: string };
export type Profile = { name: string; course: string; weeklyGoal: number; email: string };
export type AppData = { tasks: Task[]; flashcards: Flashcard[]; teams: Team[]; focusMinutes: number; profile: Profile };

const offsetDate = (days: number) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };

export const defaultData: AppData = {
  tasks: [
    { id: "1", title: "Resumo de eletromagnetismo", subject: "Física", dueDate: offsetDate(1), priority: "Alta", completed: false },
    { id: "2", title: "Lista de derivadas", subject: "Cálculo", dueDate: offsetDate(3), priority: "Média", completed: false },
    { id: "3", title: "Leitura do capítulo 6", subject: "Literatura", dueDate: offsetDate(5), priority: "Baixa", completed: true },
  ],
  flashcards: [
    { id: "1", question: "O que é a Lei de Ohm?", answer: "A relação V = R × I entre tensão, resistência e corrente.", subject: "Física", mastered: false },
    { id: "2", question: "Derivada de sen(x)", answer: "cos(x)", subject: "Cálculo", mastered: true },
    { id: "3", question: "O que caracteriza o Realismo?", answer: "Objetividade, crítica social e análise psicológica.", subject: "Literatura", mastered: false },
  ],
  teams: [
    { id: "1", name: "Grupo de Cálculo", subject: "Cálculo", members: ["DA", "MV", "LS", "BC"], nextMeeting: "Hoje, 18:30" },
    { id: "2", name: "Laboratório 3", subject: "Física", members: ["DA", "AR", "JO"], nextMeeting: "Qua, 14:00" },
  ],
  focusMinutes: 185,
  profile: { name: "Daniel", course: "Engenharia", weeklyGoal: 10, email: "daniel@exemplo.com" },
};
