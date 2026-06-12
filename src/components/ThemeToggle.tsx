import { useState, useEffect } from 'react';

// Um Hook customizado simples para gerenciar o modo dark
export function ThemeToggle() {
  // Inicializa o estado lendo do localStorage ou preferência do sistema
  const [isDark, setIsDark] = useState(() => {
    // Se o sistema estiver em modo de teste, assume escuro
    if (typeof window === 'undefined') return true; 
    
    const savedTheme = localStorage.getItem('theme');
    // Se tiver salvo, usa o salvo. Se não, usa preferência do sistema.
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Toda vez que isDark mudar, atualiza a tag <html> e o localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-full transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-inner"
      aria-label="Alternar modo escuro"
    >
      {/* Ícone Sol / Lua usando emojis para facilitar (ou use ícones do react-icons) */}
      {isDark ? (
        <span className="text-xl">☀️</span> // Sol para voltar para claro
      ) : (
        <span className="text-xl">🌙</span> // Lua para ir para escuro
      )}
    </button>
  );
}