import http.server
import socketserver
import os
import sys
import webbrowser

PORT = 3000

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 3000 포트가 이미 사용 중인 경우 3001 또는 8600으로 자동 전환
    port = PORT
    for p in [3000, 3001, 8600, 8080]:
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                print(f"============================================================")
                print(f" 👶 [둥글이 스튜디오] 1인 AI 방송국 SaaS 로컬 서버 구동 완료!")
                print(f" 👉 브라우저 주소: http://localhost:{p}")
                print(f"============================================================")
                webbrowser.open(f"http://localhost:{p}")
                httpd.serve_forever()
                break
        except OSError:
            print(f"[알림] 포트 {p} 사용 중, 다른 포트 시도...")
            continue

if __name__ == '__main__':
    run_server()
