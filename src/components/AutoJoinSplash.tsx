interface AutoJoinSplashProps {
  roomCode: string
}

export default function AutoJoinSplash({ roomCode }: AutoJoinSplashProps) {
  return (
    <div className="lobby-page">
      <div className="mx-auto flex max-w-sm flex-col items-center rounded-3xl border border-purple-500/25 bg-[#12121c] px-8 py-12 text-center shadow-2xl">
        <p className="text-4xl">♞</p>
        <h2 className="mt-4 text-lg font-bold">正在加载房间规则</h2>
        <p className="mt-2 font-mono text-3xl font-bold tracking-[0.25em] text-purple-400">{roomCode}</p>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/55">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-purple-400" />
          连接服务器并加载房间规则…
        </p>
      </div>
    </div>
  )
}
