import { useState, useEffect, useRef } from 'react'
import { chatApi } from '../api/index'
import Spinner from '../components/ui/Spinner'
import { useMemberAuth } from '../context/MemberAuthContext'

const STORAGE_KEY = 'fitos_chat_history'
function loadHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] } }
function saveHistory(m) { localStorage.setItem(STORAGE_KEY, JSON.stringify(m.slice(-40))) }

function RenderMessage({ content }) {
	const lines = content.split('\n')
	return (
		<div className="flex flex-col gap-1 text-sm leading-relaxed">
			{lines.map((line, i) => {
				if (/^[-•*]\s/.test(line)) return (
					<div key={i} className="flex gap-2">
						<span style={{ color: 'var(--color-accent)' }} className="mt-0.5 shrink-0">•</span>
						<span dangerouslySetInnerHTML={{ __html: boldify(line.replace(/^[-•*]\s/, '')) }} />
					</div>
				)
				if (/^\d+\.\s/.test(line)) {
					const num = line.match(/^(\d+)/)?.[1]
					const text = line.replace(/^\d+\.\s/, '')
					return (
						<div key={i} className="flex gap-2">
							<span className="w-4 text-right shrink-0" style={{ color: 'rgba(200,241,53,0.7)' }}>{num}.</span>
							<span dangerouslySetInnerHTML={{ __html: boldify(text) }} />
						</div>
					)
				}
				if (/^#{1,3}\s/.test(line)) return (
					<p key={i} className="mt-1 font-bold" dangerouslySetInnerHTML={{ __html: boldify(line.replace(/^#{1,3}\s/, '')) }} />
				)
				if (!line.trim()) return <div key={i} className="h-1" />
				return <p key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
			})}
		</div>
	)
}

function boldify(t) {
	return t
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/`(.+?)`/g, '<code style="background:rgba(200,241,53,0.1);padding:1px 4px;border-radius:3px;font-size:12px;color:var(--color-accent)">$1</code>')
}

export default function Chat() {
	const { member } = useMemberAuth()
	const [messages, setMessages] = useState(loadHistory)
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)
	const [suggestions, setSuggestions] = useState([])
	const [error, setError] = useState('')
	const bottomRef = useRef(null)
	const inputRef = useRef(null)

	useEffect(() => {
		chatApi.suggestions().then(({ data }) => setSuggestions(data)).catch(() => { })
	}, [])

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, loading])

	async function send(text) {
		const content = (text || input).trim()
		if (!content || loading) return
		setInput(''); setError('')
		const userMsg = { role: 'user', content }
		const newMsgs = [...messages, userMsg]
		setMessages(newMsgs)
		setLoading(true)
		try {
			const { data } = await chatApi.send(newMsgs)
			const final = [...newMsgs, { role: 'assistant', content: data.reply }]
			setMessages(final); saveHistory(final)
		} catch (err) {
			setError(err.response?.data?.message || 'Failed to get a response. Please try again.')
			setMessages(newMsgs.slice(0, -1))
		} finally { setLoading(false); inputRef.current?.focus() }
	}

	function handleKeyDown(e) {
		if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
	}

	const showWelcome = messages.length === 0

	return (
		<div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
			{/* Header */}
			<div className="flex items-center justify-between px-5 py-3 shrink-0"
				style={{ borderBottom: '1px solid var(--color-border)' }}>
				<div className="flex items-center gap-2.5">
					<div className="flex items-center justify-center w-8 h-8 text-sm rounded-full"
						style={{ background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.25)' }}>🤖</div>
					<div>
						<p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>FitBot</p>
						<div className="flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'var(--color-accent)' }} />
							<span className="text-[10px]" style={{ color: 'var(--color-secondary)' }}>AI Fitness Coach</span>
						</div>
					</div>
				</div>
				{messages.length > 0 && (
					<button onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY) }}
						className="text-xs transition-colors" style={{ color: 'var(--color-secondary)' }}
						onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
						onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-secondary)'}>
						Clear chat
					</button>
				)}
			</div>

			{/* Messages */}
			<div className="flex flex-col flex-1 gap-4 px-4 py-4 overflow-y-auto">
				{showWelcome && (
					<div className="flex flex-col items-center gap-5 pt-4 animate-fade-up">
						<div className="flex items-center justify-center w-16 h-16 text-3xl rounded-2xl"
							style={{ background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)' }}>🤖</div>
						<div className="text-center">
							<h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
								Hi {member?.name?.split(' ')[0] || 'there'} 👋
							</h2>
							<p className="max-w-xs mt-1 text-sm" style={{ color: 'var(--color-secondary)' }}>
								I'm FitBot, your AI fitness coach. Ask me anything about workouts, nutrition, or get a personalised plan.
							</p>
						</div>
						{suggestions.length > 0 && (
							<div className="flex flex-col w-full gap-2">
								<p className="text-xs text-center" style={{ color: 'var(--color-secondary)' }}>Try asking:</p>
								<div className="flex flex-wrap justify-center gap-2">
									{suggestions.map((s, i) => (
										<button key={i} onClick={() => send(s)}
											className="px-3 py-2 text-xs text-left transition-all rounded-full"
											style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-secondary)' }}
											onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(200,241,53,0.3)'; e.currentTarget.style.color = 'var(--color-accent)' }}
											onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-secondary)' }}>
											{s}
										</button>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{messages.map((msg, i) => (
					<div key={i} className={`flex gap-2.5 animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
						{msg.role === 'assistant' && (
							<div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
								style={{ background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.2)' }}>🤖</div>
						)}
						<div className="max-w-[85%] rounded-2xl px-4 py-3"
							style={msg.role === 'user'
								? { background: 'var(--color-accent)', color: '#0D0D0D', borderRadius: '18px 18px 4px 18px' }
								: { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)', borderRadius: '18px 18px 18px 4px' }
							}>
							{msg.role === 'user'
								? <p className="text-sm font-medium">{msg.content}</p>
								: <RenderMessage content={msg.content} />
							}
						</div>
					</div>
				))}

				{loading && (
					<div className="flex gap-2.5 animate-fade-up">
						<div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
							style={{ background: 'rgba(200,241,53,0.12)', border: '1px solid rgba(200,241,53,0.2)' }}>🤖</div>
						<div className="rounded-2xl px-4 py-3.5"
							style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
							<div className="flex gap-1.5 items-center">
								{[0, 1, 2].map((i) => (
									<div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
										style={{ background: 'rgba(200,241,53,0.6)', animationDelay: `${i * 150}ms` }} />
								))}
							</div>
						</div>
					</div>
				)}

				{error && (
					<div className="px-4 py-3 text-xs text-center rounded-xl"
						style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
						{error}
					</div>
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input bar */}
			<div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
				<div className="flex items-end gap-2 rounded-2xl px-4 py-2.5 transition-colors"
					style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
					onFocusCapture={(e) => e.currentTarget.style.borderColor = 'rgba(200,241,53,0.3)'}
					onBlurCapture={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
					<textarea
						ref={inputRef}
						value={input}
						onChange={(e) => {
							setInput(e.target.value)
							e.target.style.height = 'auto'
							e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
						}}
						onKeyDown={handleKeyDown}
						placeholder="Ask FitBot anything…"
						rows={1}
						disabled={loading}
						className="flex-1 text-sm leading-relaxed bg-transparent outline-none resize-none max-h-32"
						style={{ height: '24px', color: 'var(--color-primary)' }}
					/>
					<button onClick={() => send()} disabled={loading || !input.trim()}
						className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
						style={{ background: 'var(--color-accent)', color: '#0D0D0D' }}>
						{loading
							? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
							: <span className="text-sm font-bold">↑</span>
						}
					</button>
				</div>
				<p className="text-[10px] text-center mt-2" style={{ color: 'var(--color-hint)' }}>
					FitBot can make mistakes. Always consult a professional for medical advice.
				</p>
			</div>
		</div>
	)
}