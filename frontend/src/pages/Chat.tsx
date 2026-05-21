import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiFetch } from '../services/api';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import styles from './Chat.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: string | null;
  sources?: { file_path: string; start_line?: number }[] | null;
  createdAt: string;
}

interface Conversation {
  id: string;
}

export function Chat() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function createNewConversation(): Promise<Conversation> {
    return apiFetch<Conversation>(`/projects/${projectId}/conversations`, {
      method: 'POST',
    });
  }

  async function loadMessages(convId: string) {
    const msgs = await apiFetch<Message[]>(
      `/conversations/${convId}/messages`,
    );
    setMessages(msgs);
  }

  async function initConversation() {
    try {
      const conversations = await apiFetch<Conversation[]>(
        `/projects/${projectId}/conversations`,
      );
      if (conversations.length > 0) {
        setConversationId(conversations[0].id);
        await loadMessages(conversations[0].id);
      } else {
        const conv = await createNewConversation();
        setConversationId(conv.id);
      }
    } catch (err) {
      console.error('Failed to init conversation:', err);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    initConversation();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !conversationId || loading) return;

    const userContent = input.trim();
    setInput('');
    setLoading(true);

    const tempMsg: Message = { id: `temp-${Date.now()}`, role: 'user', content: userContent, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await apiFetch<{ userMessage: Message; assistantMessage: Message }>(`/conversations/${conversationId}/messages`, {
        method: 'POST', body: JSON.stringify({ content: userContent }),
      });
      setMessages((prev) => [...prev.filter((m) => m.id !== tempMsg.id), res.userMessage, res.assistantMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className={styles.backButton}
        >
          ← Voltar
        </button>
        <h1 className={styles.title}>Chat — LegacyLens</h1>
      </header>

      <div className={styles.messagesContainer}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className={`${styles.bubble} ${styles.assistant}`}>
            <div className={styles.thinking}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.thinkingText}>Analisando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className={styles.inputBar}>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre o código legado..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={loading || !input.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div
      className={`${styles.bubble} ${isAssistant ? styles.assistant : styles.user}`}
    >
      {isAssistant && message.confidence && (
        <ConfidenceBadge
          level={message.confidence as 'HIGH' | 'MEDIUM' | 'LOW'}
        />
      )}
      <div className={styles.markdownContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
      {isAssistant && message.sources && (
        <SourcesList sources={message.sources} />
      )}
    </div>
  );
}

function SourcesList({
  sources,
}: {
  sources: { file_path: string; start_line?: number }[];
}) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className={styles.sources}>
      <span className={styles.sourcesLabel}>Referências:</span>
      {sources.map((src, i) => (
        <span key={i} className={styles.sourceBadge}>
          📄 {src.file_path}
          {src.start_line ? `:${src.start_line}` : ''}
        </span>
      ))}
    </div>
  );
}
