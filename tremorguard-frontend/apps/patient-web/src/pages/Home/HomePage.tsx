/**
 * 首页（AI 对话界面）
 * 严格对照设计稿：tremorguard-app/pages/AI 对话首页（桌面端）.html
 *
 * 布局结构（响应式）：
 *  - 移动端 (< 768px)：状态栏 + 顶部栏 + 聊天 + 快捷操作 + 输入栏 + 底部 Tab
 *  - 桌面端 (>= 768px)：左侧 240px 侧边栏 + 主对话区
 *  - 大屏 (>= 1440px)：桌面端布局 + 右侧 320px 今日概览
 *
 * 主内容区结构：
 *  <header>  顶部栏：标题 + 连接徽章 + 设置
 *  <section> 聊天区 (flex-1, overflow-y-auto)
 *  <footer>  底部区：快捷操作 chip + 输入栏
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AiAvatarIcon,
  MicIcon,
  SendIcon,
  PillIcon,
  CheckCircleIcon,
  WarningIcon,
  ClockIcon,
  ShareIcon,
  EyeIcon,
  PhoneIcon,
  ChartIcon,
  DocumentIcon,
} from '../../components/icons/Icons';
import { TopNav } from '../../components/layout/TopNav';
import { StatusBar } from '../../components/layout/StatusBar';
import { RichCardButton } from '../../components/ui/RichCardButton';
import { useResponsive } from '../../hooks/useResponsive';
import {
  INITIAL_CHAT_MESSAGES,
  QUICK_ACTIONS,
  type ChatMessage,
  type MedicationCardAction,
} from '../../data/mockData';

function now(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const QUICK_ACTION_ROUTES: Record<string, string> = {
  查看今日报告: '/reports/rpt-20250724',
  用药记录: '/medication',
};

const AI_REPLIES: string[] = [
  '已记录您的状态，请保持规律用药。',
  '收到，建议您多休息，如有不适请及时联系医生。',
  '根据最近数据，您的震颤控制情况良好。',
];

const QUICK_ACTION_ICONS: Record<string, React.ReactNode> = {
  查看今日报告: <DocumentIcon size={14} />,
  用药记录: <PillIcon size={14} color="var(--tg-primary)" />,
  最近一周趋势: <ChartIcon size={14} />,
  联系医生: <PhoneIcon size={14} />,
};



export function HomePage() {
  const navigate = useNavigate();
  const responsive = useResponsive();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isAiTyping]);

  // 监听聊天区滚动：用户向上滚动时显示「回到最新」按钮
  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollToBottom(distance > 240);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 全局快捷键：⌘/Ctrl + K 聚焦输入框；Esc 失焦
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (e.key === 'Escape' && tag === 'INPUT') {
        (e.target as HTMLInputElement).blur();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = chatAreaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  const handleAction = useCallback(
    (msgId: string, action: MedicationCardAction) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;

          if (m.kind === 'medication-card') {
            return {
              ...m,
              medicationConfirmed: true,
              confirmedTime: now(),
              confirmedText:
                action.action === 'confirm-medication' ? '已确认服药' : '已稍后提醒',
              actions: m.actions?.map((a) => ({
                ...a,
                variant:
                  a.action === action.action ? 'disabled' : 'disabled-secondary',
              })),
            };
          }

          if (m.kind === 'alert-card') {
            return {
              ...m,
              alertHandled: true,
              alertSuccessBody:
                action.action === 'confirm-medication'
                  ? '已记录服药，请观察 30 分钟。若震颤未缓解请及时联系医生。'
                  : action.action === 'notify-caregiver'
                    ? '已通知照护者，将通过电话跟进。'
                    : '已为您打开数据详情页。',
              actions: m.actions?.map((a) => ({
                ...a,
                variant:
                  a.action === action.action ? 'disabled' : 'disabled-secondary',
              })),
            };
          }

          return m;
        }),
      );

      if (action.action === 'view-report') {
        navigate('/reports/rpt-20250724');
      } else if (action.action === 'share-report') {
        // web 端无原生 share，可后续接 Web Share API
        window.alert('分享功能开发中');
      }
    },
    [navigate],
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isAiTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, kind: 'user-text', time: now(), text },
    ]);
    setInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          kind: 'ai-text',
          time: now(),
          text: AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)] ?? AI_REPLIES[0]!,
        },
      ]);
      setIsAiTyping(false);
    }, 1200);
  }, [input, isAiTyping]);

  const handleQuickAction = useCallback(
    (label: string) => {
      const route = QUICK_ACTION_ROUTES[label];
      if (route) {
        navigate(route);
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, kind: 'user-text', time: now(), text: label },
      ]);
      setIsAiTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            kind: 'ai-text',
            time: now(),
            text:
              label === '联系医生'
                ? '已为您预约张医生本周五上午 10 点的复诊，详情请查看「我的报告」。'
                : '本周震颤强度整体下降，详细趋势请查看「我的报告」中的周报。',
          },
        ]);
        setIsAiTyping(false);
      }, 1200);
    },
    [navigate],
  );

  const handleSettings = useCallback(() => navigate('/profile'), [navigate]);

  const chatPadding = useMemo(() => {
    // 对齐设计稿：桌面端 px-8 py-6，移动端 px-4 py-4
    if (responsive.isMobile) {
      return { padding: '16px 16px' };
    }
    return { padding: '24px 32px' };
  }, [responsive.device]);

  const bubbleMaxWidth = responsive.isMobile ? '84%' : '65%';

  return (
    <div
      className="page-enter flex h-full min-h-0 flex-1 flex-col"
      style={{ background: 'var(--tg-background)' }}
    >
      {/* 移动端状态栏 */}
      <StatusBar />

      {/* 顶部导航（home 变体自带连接徽章 + 设置按钮） */}
      <TopNav
        title="对话助手"
        variant="home"
        deviceConnected
        onSettings={handleSettings}
      />

      {/* ===== Chat Area ===== */}
      <div className="relative min-h-0 flex-1">
        <section
          ref={chatAreaRef}
          className="no-scrollbar h-full overflow-y-auto"
          style={{ ...chatPadding, background: 'var(--tg-background)' }}
        >
          {messages.map((m) => (
            <ChatMessageView
              key={m.id}
              message={m}
              bubbleMaxWidth={bubbleMaxWidth}
              onAction={handleAction}
            />
          ))}
          {isAiTyping && <TypingIndicator bubbleMaxWidth={bubbleMaxWidth} />}
        </section>

        {/* 滚动到最新：仅在用户向上滚动时显示 */}
        {showScrollToBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="回到最新消息"
            className="tg-scroll-btn tg-pressable absolute left-1/2 z-20 -translate-x-1/2 rounded-full"
            style={{
              bottom: 12,
              padding: '8px 14px',
              fontSize: 'var(--tg-text-sm)',
              fontWeight: 'var(--tg-weight-medium)',
              background: 'var(--tg-card)',
              color: 'var(--tg-primary)',
              border: '1px solid var(--tg-border)',
              boxShadow: 'var(--tg-shadow-floating)',
              minHeight: 36,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            回到最新
          </button>
        )}
      </div>

      {/* ===== Bottom Area ===== */}
      {/* 设计稿：px-8 pb-6 pt-2 → 桌面 32px/24px/8px，移动端 16px/16px/8px */}
      <footer
        className="flex-shrink-0"
        style={{
          padding: responsive.isMobile ? '8px 16px 16px 16px' : '8px 32px 24px 32px',
          background: 'var(--tg-background)',
        }}
      >
        {/* Quick action chips - 设计稿：px-3 py-1.5 rounded-full, 无 min-height */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {QUICK_ACTIONS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickAction(label)}
              className="tg-chip flex items-center gap-1.5 rounded-full"
              style={{
                padding: '6px 12px',
                background: 'var(--tg-card)',
                border: '1px solid var(--tg-border)',
                color: 'var(--tg-primary)',
                fontSize: 'var(--tg-text-sm)',
                cursor: 'pointer',
              }}
            >
              {QUICK_ACTION_ICONS[label]}
              {label}
            </button>
          ))}
        </div>

        {/* Input bar - 设计稿：gap-3 p-2 rounded-xl */}
        <div
          className="tg-input-bar flex items-center gap-3 rounded-xl"
          style={{
            padding: 8,
            background: 'var(--tg-card)',
            border: '1px solid var(--tg-border)',
            boxShadow: 'var(--tg-shadow-md)',
          }}
        >
          <button
            type="button"
            aria-label="语音输入"
            className="flex items-center justify-center rounded-lg tg-pressable tg-hover-muted"
            style={{
              width: 40,
              height: 40,
              color: 'var(--tg-muted-foreground)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <MicIcon size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息..."
            aria-label="消息输入框"
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{
              fontSize: 'var(--tg-text-base)',
              color: 'var(--tg-foreground)',
              height: 44,
              fontFamily: 'var(--tg-font-sans)',
              border: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            aria-label="发送"
            disabled={!input.trim() || isAiTyping}
            className="tg-send-btn flex items-center justify-center rounded-lg disabled:opacity-40"
            style={{
              width: 40,
              height: 40,
              background: 'var(--tg-primary)',
              color: 'white',
              border: 'none',
              cursor: input.trim() && !isAiTyping ? 'pointer' : 'not-allowed',
              flexShrink: 0,
            }}
          >
            <SendIcon size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function TypingIndicator({ bubbleMaxWidth }: { bubbleMaxWidth: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 message-enter">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'var(--tg-primary)' }}
      >
        <AiAvatarIcon size={20} className="text-primary-foreground" />
      </div>
      <div
        className="flex items-center gap-1.5 rounded-xl"
        style={{
          maxWidth: bubbleMaxWidth,
          background: 'var(--tg-card)',
          boxShadow: 'var(--tg-shadow-sm)',
          border: '1px solid var(--tg-border)',
          padding: 14,
        }}
      >
        <span
          className="typing-dot inline-block rounded-full"
          style={{ width: 8, height: 8, background: 'var(--tg-primary)' }}
        />
        <span
          className="typing-dot inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            background: 'var(--tg-primary)',
            animationDelay: '0.2s',
          }}
        />
        <span
          className="typing-dot inline-block rounded-full"
          style={{
            width: 8,
            height: 8,
            background: 'var(--tg-primary)',
            animationDelay: '0.4s',
          }}
        />
      </div>
    </div>
  );
}

interface ChatMessageViewProps {
  message: ChatMessage;
  bubbleMaxWidth: string;
  onAction: (msgId: string, action: MedicationCardAction) => void;
}

function ChatMessageView({ message, bubbleMaxWidth, onAction }: ChatMessageViewProps) {
  if (message.kind === 'user-text') {
    return (
      <div className="mb-6 flex items-start justify-end gap-3 message-enter">
        <div style={{ maxWidth: bubbleMaxWidth }}>
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--tg-primary)',
              color: 'white',
              fontSize: 'var(--tg-text-base)',
              lineHeight: 1.6,
            }}
          >
            <p>{message.text}</p>
          </div>
          <span
            className="mt-1.5 block text-right"
            style={{ fontSize: 12, color: 'var(--tg-neutral-400)' }}
          >
            {message.time}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 message-enter">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'var(--tg-primary)' }}
      >
        <AiAvatarIcon size={20} className="text-primary-foreground" />
      </div>
      <div style={{ maxWidth: bubbleMaxWidth, minWidth: 0 }}>
        <MessageBubble message={message} onAction={onAction} />
        <span
          className="mt-1.5 block"
          style={{ fontSize: 12, color: 'var(--tg-neutral-400)' }}
        >
          {message.time}
        </span>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  onAction: (msgId: string, action: MedicationCardAction) => void;
}

function MessageBubble({ message, onAction }: MessageBubbleProps) {
  if (message.kind === 'ai-text') {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--tg-card)',
          boxShadow: 'var(--tg-shadow-sm)',
          border: '1px solid var(--tg-border)',
          fontSize: 'var(--tg-text-base)',
          color: 'var(--tg-foreground)',
          lineHeight: 1.6,
        }}
      >
        <p>{message.text}</p>
      </div>
    );
  }

  if (message.kind === 'ai-summary') {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--tg-card)',
          boxShadow: 'var(--tg-shadow-sm)',
          border: '1px solid var(--tg-border)',
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span
            className="font-medium"
            style={{ fontSize: 'var(--tg-text-base)', color: 'var(--tg-foreground)' }}
          >
            {message.summaryTitle ?? '早安问候'}
          </span>
          <span
            className="rounded px-2 py-0.5 text-xs font-medium"
            style={{
              background: 'var(--tg-msg-system)',
              color: 'var(--tg-primary)',
            }}
          >
            {message.summaryTag ?? '每日摘要'}
          </span>
        </div>
        <p
          style={{
            fontSize: 'var(--tg-text-base)',
            color: 'var(--tg-foreground)',
            lineHeight: 1.6,
            margin: 0,
          }}
          dangerouslySetInnerHTML={{
            __html: (message.summaryBody ?? message.text ?? '').replace(
              /2\.1\/10/,
              '<strong style="color: var(--tg-primary);">2.1</strong>/10',
            ),
          }}
        />
        {message.summaryFooter && (
          <p
            style={{
              fontSize: 'var(--tg-text-sm)',
              color: 'var(--tg-muted-foreground)',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            {message.summaryFooter}
          </p>
        )}
      </div>
    );
  }

  if (message.kind === 'medication-card') {
    const confirmed = message.medicationConfirmed;
    return (
      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: 'var(--tg-card)',
          boxShadow: 'var(--tg-shadow-sm)',
          border: '1px solid var(--tg-border)',
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            borderBottom: '1px solid var(--tg-border)',
          }}
        >
          <PillIcon size={18} color="var(--tg-warning)" />
          <span
            className="font-medium"
            style={{ fontSize: 'var(--tg-text-base)', color: 'var(--tg-foreground)' }}
          >
            {message.medicationTitle}
          </span>
        </div>
        <div className="px-4 py-3">
          <p
            style={{
              fontSize: 'var(--tg-text-base)',
              color: 'var(--tg-foreground)',
              lineHeight: 1.5,
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html: (message.medicationBody ?? '').replace(
                /美多芭（左旋多巴）/,
                '<strong>美多芭（左旋多巴）</strong>',
              ),
            }}
          />
          {message.medicationMeta && (
            <div
              className="mt-3 flex items-center gap-2"
              style={{
                color: 'var(--tg-muted-foreground)',
                fontSize: 'var(--tg-text-sm)',
              }}
            >
              <ClockIcon size={14} />
              <span>{message.medicationMeta}</span>
            </div>
          )}
        </div>
        {!confirmed && message.actions && (
          <div className="flex items-center gap-2 px-4 pb-3">
            {message.actions.map((a, i) => {
              const isPrimary = a.action === 'confirm-medication';
              return (
                <RichCardButton
                  key={i}
                  variant={isPrimary ? 'primary' : 'ghost'}
                  onClick={() => onAction(message.id, a)}
                >
                  {isPrimary && <CheckCircleIcon size={16} />}
                  {!isPrimary && <ClockIcon size={16} />}
                  {a.label}
                </RichCardButton>
              );
            })}
          </div>
        )}
        {confirmed && (
          <div
            className="flex items-center gap-2 px-4 pb-3"
            style={{ color: 'var(--tg-muted-foreground)', fontSize: 12 }}
          >
            <CheckCircleIcon size={12} />
            <span>
              {message.confirmedText} · {message.confirmedTime}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (message.kind === 'alert-card') {
    const dismissed = message.alertHandled;
    return (
      <div
        className={`overflow-hidden rounded-xl ${!dismissed ? 'alert-pulse' : ''}`}
        style={{
          background: 'var(--tg-card)',
          boxShadow: 'var(--tg-shadow-sm)',
          border: `1px solid ${dismissed ? 'var(--tg-border)' : 'var(--state-error)'}`,
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: dismissed ? 'var(--tg-card)' : 'var(--state-error-light)',
            borderBottom: dismissed
              ? '1px solid var(--tg-border)'
              : '1px solid rgba(220,38,38,0.15)',
          }}
        >
          <WarningIcon size={18} color={dismissed ? 'var(--state-success)' : 'var(--state-error)'} />
          <span
            className="font-bold"
            style={{
              fontSize: 'var(--tg-text-sm)',
              color: dismissed ? 'var(--state-success)' : 'var(--state-error)',
            }}
          >
            {message.alertTitle}
          </span>
        </div>
        <div className="px-4 py-3">
          <p
            style={{
              fontSize: 'var(--tg-text-base)',
              color: 'var(--tg-foreground)',
              lineHeight: 1.5,
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html: (message.alertBody ?? '').replace(
                /7\.8Hz/,
                '<strong style="color: var(--state-error);">7.8Hz</strong>',
              ),
            }}
          />
          {message.alertList && (
            <ul
              className="mt-2 space-y-1"
              style={{
                fontSize: 'var(--tg-text-sm)',
                color: 'var(--tg-muted-foreground)',
                paddingLeft: 0,
                listStyle: 'none',
                margin: '8px 0 0 0',
              }}
            >
              {message.alertList.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: 'var(--tg-neutral-400)' }}>{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {message.alertSuccessBody && (
            <p
              style={{
                fontSize: 'var(--tg-text-sm)',
                color: 'var(--state-success)',
                lineHeight: 1.5,
                marginTop: 6,
              }}
            >
              {message.alertSuccessBody}
            </p>
          )}
        </div>
        {!dismissed && message.actions && (
          <div className="flex items-center gap-2 px-4 pb-3">
            {message.actions.map((a, i) => {
              const isPrimary = a.action === 'confirm-medication';
              return (
                <RichCardButton
                  key={i}
                  variant={isPrimary ? 'error' : 'ghost'}
                  onClick={() => onAction(message.id, a)}
                >
                  {isPrimary && <CheckCircleIcon size={16} />}
                  {!isPrimary && <PhoneIcon size={16} />}
                  {a.label}
                </RichCardButton>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (message.kind === 'report-card') {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--tg-card)',
          boxShadow: 'var(--tg-shadow-sm)',
          border: '1px solid var(--tg-border)',
        }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <EyeIcon size={18} color="var(--tg-primary)" />
          <span
            className="font-medium"
            style={{ fontSize: 'var(--tg-text-base)', color: 'var(--tg-foreground)' }}
          >
            {message.reportTitle ?? '每日健康报告'}
          </span>
          {message.reportDate && (
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'var(--state-success-light)',
                color: 'var(--state-success)',
              }}
            >
              {message.reportDate}
            </span>
          )}
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3">
          {(message.reportStats ?? []).map((stat, i) => (
            <div
              key={i}
              className="rounded-lg p-3 text-center"
              style={{ background: 'var(--tg-neutral-50)' }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: stat.color ?? 'var(--tg-primary)' }}
              >
                {stat.value}
              </div>
              <div
                className="mt-1 text-xs"
                style={{ color: 'var(--tg-muted-foreground)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 'var(--tg-text-sm)',
            color: 'var(--tg-muted-foreground)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {message.text}
        </p>

        {message.actions && (
          <div className="mt-3 flex items-center gap-2">
            {message.actions.map((a, i) => {
              const isPrimary = a.variant === 'primary';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAction(message.id, a)}
                  className={`flex items-center justify-center gap-2 rounded-lg font-medium tg-pressable ${
                    isPrimary ? 'tg-hover-primary' : 'tg-hover-muted'
                  }`}
                  style={{
                    padding: '8px 16px',
                    minHeight: 40,
                    fontSize: 'var(--tg-text-sm)',
                    background: isPrimary ? 'var(--tg-primary)' : 'var(--tg-muted)',
                    color: isPrimary ? 'white' : 'var(--tg-muted-foreground)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {a.action === 'view-report' && (
                    <EyeIcon size={14} color={isPrimary ? 'white' : 'currentColor'} />
                  )}
                  {a.action === 'share-report' && <ShareIcon size={14} />}
                  {a.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
