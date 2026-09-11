import chatbotImg from '../../assets/chatbot.png'

interface ChatbotIconProps {
  size?: number | string
  className?: string
  style?: React.CSSProperties
  alt?: string
}

export default function ChatbotIcon({
  size = 20,
  className,
  style,
  alt = 'Chatbot',
}: ChatbotIconProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size

  return (
    <img
      src={chatbotImg}
      alt={alt}
      className={className}
      style={{
        width: dimension,
        height: dimension,
        objectFit: 'contain',
        filter: 'brightness(0) invert(1)',
        display: 'inline-block',
        verticalAlign: 'middle',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
