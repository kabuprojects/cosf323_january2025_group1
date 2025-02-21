import psutil
import kivy
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

# Show a popup with the tip
def show_popup(message):
    print(f"Showing popup with message: {message}")  # Debugging line to show message in console

    # Popup is created using Kivy's Popup widget
    layout = BoxLayout(orientation='vertical', padding=10)
    label = Label(text=message, color=(0, 0, 0, 1), font_size=18, halign="center", valign="middle")  # Black text
    button = Button(text="Got it!", on_press=lambda *args: popup.dismiss())

    layout.add_widget(label)
    layout.add_widget(button)

    popup = Popup(title="Cyber Knowledge", content=layout, size_hint=(None, None), size=(400, 200))
    popup.open()

# Monitor applications and show pop-ups based on app launch
def monitor_apps():
    tips = load_tips()  # Load tips from the file
    while True:
        # Get list of all currently running processes
        processes = psutil.process_iter(['pid', 'name'])
        
        for proc in processes:
            try:
                # Print the process name for debugging
                print(f"Checking process: {proc.info['name']}")

                # Check if the process name is in our target list
                if proc.info['name'].lower() in [app.lower() for app in target_apps]:
                    print(f"Detected: {proc.info['name']} with PID {proc.info['pid']}")

                    # Show the pop-up with a contextual cybersecurity tip based on the app
                    app_name = proc.info['name'].lower()
                    if app_name in tips:
                        show_popup(tips[app_name])

            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        # Add a small delay to reduce CPU usage
        time.sleep(1)  # Sleep for 1 second

# Create a settings window to adjust user preferences (optional)
# We can skip this for simplicity in the example.

class CyberKnowledgeApp(App):
    def build(self):
        self.title = "Cyber Knowledge"
        
        # Start the app monitor in a separate thread
        threading.Thread(target=monitor_apps, daemon=True).start()

        # Remove the label text "Cyber Knowledge App is Running..." (no need for it)
        return Label(text="", font_size=24)  # This will make the window not have unnecessary text

if __name__ == "__main__":
    CyberKnowledgeApp().run()
