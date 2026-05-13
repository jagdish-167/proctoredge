ProctorEdge — Intelligent Online Exam Proctoring System
ProctorEdge is an advanced AI-powered online examination monitoring platform designed to detect and prevent cheating during remote exams using real-time computer vision, behavioral analysis, and browser security technologies.
The system uses a student’s webcam, microphone, and browser activity to continuously analyze behavior during examinations. By combining Artificial Intelligence, face tracking, eye movement analysis, object detection, and audio monitoring, ProctorEdge can identify suspicious activities such as looking away repeatedly, mobile phone usage, multiple people in frame, tab switching, talking, and other cheating attempts.
The platform provides a secure and automated proctoring environment for schools, colleges, universities, certification platforms, and online learning systems.
━━━━━━━━━━━━━━━━━━━━━━━
DEVELOPMENT TEAM
Developer:
Jagdish Solunke
Presentation Team:
Chaitanya Kulkarni
Sachin Patharkar
Vardhan Paithane
━━━━━━━━━━━━━━━━━━━━━━━
KEY FEATURES
• AI-Based Behavior Detection
Real-time face detection and recognition
Eye gaze and head movement tracking
Multiple face detection
No-face monitoring
Suspicious posture analysis
AI-generated cheating probability score
• Object Detection System
Using advanced YOLO-based AI models, the system can detect:
Mobile phones
Books and notes
Earphones
External devices
Suspicious objects near the student
• Audio Monitoring
The platform analyzes microphone input to detect:
Talking
Whispering
Multiple voices
Background conversation or noise anomalies
• Browser Security Protection
ProctorEdge tracks and restricts:
Tab switching
Window minimization
Copy-paste actions
Developer tools access
Keyboard shortcut abuse
Right-click usage
• Real-Time Admin Dashboard
Admins and exam supervisors can:
Monitor students live
Receive instant alerts
View suspicious activity logs
Access screenshots and evidence
Analyze AI risk reports
Replay recorded exam sessions
━━━━━━━━━━━━━━━━━━━━━━━
TECHNOLOGY USED
Frontend:
React.js / Next.js
Tailwind CSS
Framer Motion
WebRTC
TensorFlow.js
Backend:
Node.js
Express.js
FastAPI
MongoDB
Socket.IO
Artificial Intelligence:
OpenCV
YOLOv8
MediaPipe
Pose Estimation
Face Mesh Tracking
Voice Activity Detection
━━━━━━━━━━━━━━━━━━━━━━━
HOW IT WORKS
Student logs into the exam portal.
System requests webcam and microphone access.
AI begins real-time monitoring.
Suspicious actions are detected instantly.
Evidence is stored with timestamps.
Risk score updates dynamically.
Admin dashboard receives live alerts.
Final integrity report is generated after exam completion.
━━━━━━━━━━━━━━━━━━━━━━━
MAIN OBJECTIVES
Prevent cheating in online exams
Automate remote invigilation
Improve exam integrity
Reduce need for manual supervision
Provide scalable AI-based monitoring
━━━━━━━━━━━━━━━━━━━━━━━
TARGET USERS
Universities
Schools
Online certification platforms
EdTech companies
Recruitment assessment platforms
Government examination systems
━━━━━━━━━━━━━━━━━━━━━━━
UNIQUE ADVANTAGES
Fully AI-driven monitoring
Real-time suspicious activity analysis
Advanced object and behavior detection
Enterprise-level dashboard
Scalable cloud-ready architecture
Secure and encrypted monitoring system
━━━━━━━━━━━━━━━━━━━━━━━
FUTURE SCOPE
AI emotion analysis
Multi-camera support
Mobile app integration
Voice authentication
Advanced biometric verification
AI-generated exam reports
Blockchain-based exam integrity records
━━━━━━━━━━━━━━━━━━━━━━━
PROJECT VISION
ProctorEdge aims to create a fair, secure, and intelligent online examination environment where educational institutions can confidently conduct remote assessments without compromising exam integrity. By combining AI surveillance, behavioral analysis, and real-time monitoring, the platform transforms online examinations into a highly secure digital experience.
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
