import type { ContextItem } from '~/components/context-item';

export interface Message {
  isUser: boolean;
  text?: string;
  context: ContextItem[];
}

export function useAssistant() {
  const messages = ref<Message[]>([]);
  const addMessage = (message: Omit<Message, 'context'>) => {
    messages.value.push({ ...message, context: [] });
  };

  const prepareMessage = () => {
    messages.value.push({ isUser: false, context: [] });
  };

  const setMessage = (text: string) => {
    messages.value[messages.value.length - 1] = {
      ...messages.value[messages.value.length - 1],
      text,
    };
  };

  const addContext = (context: ContextItem) => {
    if (context.title.startsWith('slack:')) {
      context.title = `Slack`;
    }
    if (context.title.startsWith('confluence:')) {
      context.title = `Confluence: ${context.title.slice(11).replace('.txt', '')}`;
    }
    messages.value[messages.value.length - 1].context.push(context);
  };

  const isLoading = ref(false);

  function startChat(question: string) {
    isLoading.value = true;
    const eventSource = new EventSource(`/api/query?question=${encodeURIComponent(question)}`);
    prepareMessage();
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.answer) {
        setMessage(data.answer);
        isLoading.value = false;
      } else if (data.context) {
        addContext({ title: data.title, text: data.context });
      }
    };
  }

  return {
    messages,
    isLoading,
    addMessage,
    startChat,
  };
}
