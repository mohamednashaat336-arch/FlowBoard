export default function Button({
  children,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}) {
  const variantClass = variant === 'primary' ? 'fb-button--primary' : 'fb-button--secondary'

  return (
    <button
      className={`btn fb-button ${variantClass} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
