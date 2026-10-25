import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FAF8F5",       // 전체 배경용 따뜻한 아이보리
          card: "#FFFDF9",     // 카드 배경용 웜 화이트
          border: "#EFE8DC",   // 부드러운 테두리
          cream: "#FBF7EE",    // 포근한 크림톤
          yellow: {
            50: "#FEFCE8",
            100: "#FEF9C3",
            200: "#FEF08A",    // 파스텔 옐로우 메인
            300: "#FDE047",
            400: "#FACC15",
            500: "#EAB308",
          },
          coral: {
            50: "#FFF1F2",
            100: "#FFE4E6",
            500: "#F43F5E",
            600: "#E11D48",
          },
          text: {
            main: "#292524",    // 웜 차콜 (눈이 편한 텍스트)
            muted: "#78716C",   // 부드러운 회갈색
            sub: "#A8A29E",
          }
        },
      },
      boxShadow: {
        warm: "0 4px 20px -2px rgba(180, 160, 130, 0.12), 0 2px 6px -1px rgba(180, 160, 130, 0.08)",
        card: "0 10px 30px -4px rgba(120, 100, 80, 0.08)",
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
};
export default config;
