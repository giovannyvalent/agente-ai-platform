// Wordmark da Venture — sem arquivo de logo oficial anexado ainda, então é
// renderizado como texto estilizado seguindo a referência (Inter, caixa alta,
// letter-spacing largo). Trocar por um <img>/<svg> se um arquivo oficial chegar.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-[0.2em] text-[0.95rem] text-ivory ${className}`}>
      VENTURE
    </span>
  );
}
