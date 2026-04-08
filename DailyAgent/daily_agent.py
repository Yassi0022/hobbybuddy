import os
import requests
import re
import datetime
from plyer import notification
from jinja2 import Environment, FileSystemLoader
import ollama

MODEL = "qwen2.5-coder:7b"
GITHUB_USER = "Yassi0022"

JOB_TITLES = [
    "data scientist",
    "HR",
    "HR Analyst",
    "sviluppatore Java",
    "sviluppatore Python",
    "Data Analyst",
    "Software Engineer"
]
LOCATIONS = ["Italia", "Remoto"]

def scrape_jobs():
    """
    Esegue uno scraping base di LinkedIn ed Indeed per le offerte di lavoro.
    Nota: LinkedIn e Indeed hanno difese anti-bot molto rigorose e potrebbero
    bloccare richieste automatizzate. Questo è un'implementazione basica 
    usando requests.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    jobs = []
    
    for title in JOB_TITLES:
        for loc in LOCATIONS:
            # Simulazione ricerca Linkedin
            query = f"{title} {loc}".replace(' ', '%20')
            url_li = f"https://it.linkedin.com/jobs/search?keywords={query}&location=Italia"
            try:
                res = requests.get(url_li, headers=headers, timeout=5)
                # Estrazione grezza dei job title tramite regex
                titles = re.findall(r'<h3 class="base-search-card__title">\s*(.*?)\s*</h3>', res.text, re.DOTALL)
                companies = re.findall(r'<h4 class="base-search-card__subtitle">\s*(.*?)\s*</h4>', res.text, re.DOTALL)
                
                for i in range(min(len(titles), 3)): # prendiamo i primi 3 per query
                    jobs.append({
                        "platform": "LinkedIn",
                        "title": titles[i].strip() if '<' not in titles[i] else title,
                        "company": companies[i].strip() if i < len(companies) and '<' not in companies[i] else "Consultare la pagina per i dettagli",
                        "location": loc,
                        "url": url_li
                    })
            except Exception as e:
                print(f"Errore scraping LinkedIn per {title}: {e}")

            # Simulazione ricerca Indeed
            url_ind = f"https://it.indeed.com/jobs?q={query}&l={loc}"
            try:
                # Indeed blocca spesso le richieste da script, tentiamo comunque
                res = requests.get(url_ind, headers=headers, timeout=5)
                if res.status_code == 200:
                    jobs.append({
                        "platform": "Indeed",
                        "title": title,
                        "company": "Varie aziende - Clicca per vedere",
                        "location": loc,
                        "url": url_ind
                    })
            except Exception as e:
                pass
                
    return jobs

def get_github_summary():
    """
    Recupera i commit degli ultimi 7 giorni tramite GitHub API.
    """
    url = f"https://api.github.com/users/{GITHUB_USER}/events"
    events = []
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            events_data = res.json()
            seven_days_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
            
            for ev in events_data:
                ev_date = datetime.datetime.strptime(ev['created_at'], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc)
                if ev_date >= seven_days_ago and ev['type'] == 'PushEvent':
                    repo_name = ev['repo']['name']
                    commits = ev['payload'].get('commits', [])
                    for c in commits:
                        events.append(f"[{repo_name}] {c['message']}")
    except Exception as e:
        print(f"Errore recupero GitHub: {e}")
        
    return events

def get_dev_suggestion(github_events):
    """
    Usa Ollama per suggerire cosa sviluppare basandosi sull'attività GitHub.
    """
    commits_text = "\n".join(github_events) if github_events else "Nessuna attività registrata."
    prompt = (
        f"Sono uno sviluppatore. Negli ultimi 7 giorni ho lavorato a queste modifiche GitHub:\n"
        f"{commits_text}\n\n"
        f"Sulla base dei miei commit recenti o in generale, suggeriscimi 1 piccolo e ben definito task "
        f"o feature che potrei sviluppare oggi. Sii conciso e spiega in massimo 3/4 frasi."
    )
    
    try:
        response = ollama.generate(model=MODEL, prompt=prompt)
        return response.get("response", "Nessun suggerimento generato da Ollama.")
    except Exception as e:
        return f"Errore nell'esecuzione di Ollama (Assicurati che sia in esecuzione e che '{MODEL}' sia scaricato): {str(e)}"

def generate_report(jobs, github_events, suggestion):
    """
    Genera il file report.html con le informazioni fornite e template Jinja2.
    """
    # Usiamo la cartella corrente per i template
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env = Environment(loader=FileSystemLoader(script_dir))
    
    try:
        template = env.get_template('report_template.html')
        html_content = template.render(
            date=datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
            jobs=jobs,
            github_events=github_events,
            suggestion=suggestion
        )
        
        report_path = os.path.join(script_dir, 'report.html')
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
    except Exception as e:
        print(f"Errore durante la generazione del report template: {e}")

def main():
    print("Avvio DailyAgent...")
    
    print("Scraping offerte di lavoro in corso (potrebbe richiedere qualche secondo)...")
    jobs = scrape_jobs()
    
    print("Recupero dati GitHub...")
    github_events = get_github_summary()
    
    print("Generazione suggerimento del giorno con Ollama...")
    suggestion = get_dev_suggestion(github_events)
    
    print("Generazione report HTML...")
    generate_report(jobs, github_events, suggestion)
    
    print("Invio notifica di sistema...")
    try:
        notification.notify(
            title='DailyAgent',
            message='Report generato con successo! Controlla report.html.',
            app_name='DailyAgent',
            timeout=10
        )
    except Exception as e:
        print(f"Non è stato possibile mostrare la notifica: {e}")
        
    print("Fatto! Esecuzione completata.")

if __name__ == "__main__":
    main()
