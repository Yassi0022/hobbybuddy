# DailyAgent

Un agente Python giornaliero per l'automazione di compiti e il supporto allo sviluppo. Genera un report giornaliero su offerte di lavoro, attività su GitHub e suggerimenti di programmazione.

## Funzionalità
1. **Offerte di lavoro**: Scraping di base da LinkedIn e Indeed per posizioni in ambito Tech/HR in Italia e Remoto.
2. **Riepilogo GitHub**: Recupera i commit degli ultimi 7 giorni per l'utente specificato via API GitHub pubbliche.
3. **Suggerimento Dev**: Usa Ollama in locale (`qwen2.5-coder:7b`) per suggerire un task di sviluppo giornaliero basato sull'attività recente.
4. **Report HTML**: Genera il file `report.html` riassuntivo usando un template Jinja2.
5. **Notifiche**: Invia una notifica di sistema Windows al termine.

## Prerequisiti
- **Python 3.8+**
- **Ollama** installato e in esecuzione localmente con il modello specificato.
  ```bash
  ollama run qwen2.5-coder:7b
  ```

## Installazione
1. Aprire il terminale nella cartella del progetto.
2. Installare le dipendenze:
   ```bash
   pip install -r requirements.txt
   ```

## Esecuzione
Esegui lo script facendo doppio clic sul file batch:
```text
run_agent.bat
```
Oppure da riga di comando:
```bash
python daily_agent.py
```
Il file eseguirà tutte le azioni previste una volta e terminerà. Troverai il report generato in `report.html`.
