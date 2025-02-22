import psutil
import kivy
from kivy.clock import Clock
from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.popup import Popup
from kivy.uix.boxlayout import BoxLayout
import threading
import time
import json

# List of applications to monitor (e.g., email client, web browser)
target_apps = ["chrome.exe", "chrome_launcher.exe", "outlook.exe", "thunderbird.exe", "firefox.exe"]

# Load tips from a JSON file
def load_tips():
    try:
        with open('tips.json', 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        # Return default tips if no file exists
        return {
            "outlook.exe": "Tip: Be cautious with email attachments! 😎",
            "chrome.exe": "Tip: Don't forget to change your passwords every now and then! 🔑",
            "firefox.exe": "Tip: Always log out of public computers. 🛑",
            "notepad.exe": "Tip: Save your work before it's too late! 😱",
            "thunderbird.exe": "Tip: Check your email settings for security! 💼"
        }

# Modified: Ensure popups are updated on the main UI thread
def show_popup(message):
    Clock.schedule_once(lambda dt: _show_popup(message))

def _show_popup(message):
    layout = BoxLayout(orientation='vertical', padding=10)
    label = Label(text=message, font_size=18, halign="center", valign="middle")
    button = Button(text="Got it!", on_press=lambda *args: popup.dismiss())

    layout.add_widget(label)
    layout.add_widget(button)

    popup = Popup(title="Cyber Knowledge", content=layout, size_hint=(None, None), size=(400, 200))
    popup.open()

# Modified: Use a scheduled function instead of infinite loop
app_last_shown = {}  # Dictionary to track last popup times


# Monitor applications and show pop-ups based on app launch
def monitor_apps_callback(dt):
    global app_last_shown
    processes = psutil.process_iter(['pid', 'name'])
    tips = load_tips()
    
    for proc in processes:
        try:
            app_name = proc.info['name'].lower()
            if app_name in [app.lower() for app in target_apps]:
                last_time = app_last_shown.get(app_name, 0)
                if time.time() - last_time > 30:  # Avoid spamming popups within 30s
                    if app_name in tips:
                        show_popup(tips[app_name])
                        app_last_shown[app_name] = time.time()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
        
        # Add a small delay to reduce CPU usage
        #time.sleep(1)  # Sleep for 1 second (hashed to be unhashed)

# Create a settings window to adjust user preferences (optional)
# We can skip this for simplicity in the example.

class CyberKnowledgeApp(App):
    def build(self):
        self.title = "Cyber Knowledge"
        Clock.schedule_interval(monitor_apps_callback, 1)  # Runs every second
        return Label(text="", font_size=24)  # Empty label for cleaner UI

        
        # Start the app monitor in a separate thread
      ##  threading.Thread(target=monitor_apps, daemon=True).start()

        # Remove the label text "Cyber Knowledge App is Running..." (no need for it)
     ##   return Label(text="", font_size=24)  # This will make the window not have unnecessary text

if __name__ == "__main__":
    CyberKnowledgeApp().run()
