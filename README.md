# AuraTrack — Autism Detection & Pediatric Health Tracker

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20(Python)-green)](https://flask.palletsprojects.com/)
[![Firebase](https://img.shields.io/badge/Database-Firebase%20Firestore-orange)](https://firebase.google.com/)
[![YOLOv8](https://img.shields.io/badge/AI-YOLOv8-red)](https://ultralytics.com/)

A full-stack, AI-powered early developmental screening and pediatric health tracking platform designed for **children aged 3–5**. It bridges parents and pediatricians by monitoring milestones, logging health metrics, running clinical questionnaires, and conducting visual behavioral screening using custom-trained Machine Learning. Built with **React 19 (Vite)** + **Flask (Python)** + **Firebase Firestore** + **YOLOv8 Computer Vision**.

---

## Core Uses & Value for Parents & Doctors

* **Early Detection (3–5 Years)**: Focuses on the critical early childhood window to spot developmental delays and autism-associated behavioral markers before formal diagnosis.
* **YOLOv8 Vision Screening**: Employs an AI computer vision model to analyze short videos/images, detecting facial symmetry, social eye-gaze indicators, and repetitive actions (e.g., hand flapping).
* **Clinical Questionnaire**: Integrates an interactive 25-question behavioral screening tool (assessing prosocial interaction, emotional reactivity, hyperactivity, conduct, and peer relationships) with automatic clinical range risk calculation.
* **Pediatric Tracking Suite**: Allows logging and charting of height, weight, sleep logs, and CDC developmental milestones.
* **One-Click Clinical Reports**: Generates professional PDF summaries containing visual charts, questionnaire breakdowns, and AI indicators to share with developmental specialists.

---

## Data Flow Architecture

The following diagram illustrates how parents and doctors interact with the application and how parameters propagate through the system:

```
[ Parent / Doctor UI ] ───► [ React 19 Frontend ] ───► [ Flask REST API ]
         ▲                           │                         │
         │                           ▼                         ▼
[ Clinical Reports ] ◄──── [ Children Dashboard ] ◄──── [ YOLOv8 Vision / Firestore ]
```

1. **Child Data Submission**: The parent adds a child profile, logging milestones, health vitals, or questionnaire answers.
2. **REST API Request**: The Vite application sends payloads to the Flask server, securely authenticated using JWT header tokens.
3. **ML YOLOv8 Inference**: Flask processes uploaded media bytes, feeds them to the custom YOLOv8 model, and extracts class confidence.
4. **Data Isolation & Storage**: Flask stores records securely in Firebase Firestore, grouping data strictly by user accounts and isolated child IDs.
5. **Dashboard Rendering**: The frontend pulls active child statistics and populates charts, progress bars, and calendar widgets.

---

## Key Features

* **Child Profile Center**: Manage multiple children, tracking growth statistics, age, and individual timelines.
* **Visual AI screening**: Streamlined media uploader with step-by-step indicators that runs real-time behavior scoring.
* **Corrected Questionnaire Logic**: Scoring logic designed for preschool assessment with proper prosocial markers, clinical cutoffs, and validation.
* **Document Library & Calendar Vault**: Vault for medical attachments and an interactive event manager (appointments, vaccinations, medicine courses) isolated by child.
* **Automatic Reminders Daemon**: Scans upcoming events in the background, showing browser notifications and visual in-app toasts.
* **Clean Dark/Light Theme**: Sleek visual mode toggles across all dashboard workspaces.

---

## Detailed Questionnaire Features (25 Questions)

To screen behavioral indicators, parents fill out a 25-question checklist mapped to 5 key clinical scales:

| Scale Name | Question Focus Areas | Scoring Guidelines & Cutoffs |
|------------|----------------------|------------------------------|
| **Prosocial Interaction** | Call response, eye contact, social smiling, pointing, gestures. | Scored directly (0-10). Higher scores represent stronger prosocial engagement. |
| **Hyperactivity / Attention** | Age-appropriate speech, following instructions, pretend play, calm transitions. | Scored with reversed keys (0-10). Measures hyperactivity risk indicators. |
| **Behavioral / Repetitive** | Echolalia, lining up objects, repetitive movements (rocking, hand flapping). | Scored directly (0-10). Identifies restricted/repetitive patterns. |
| **Emotional / Sensory** | Emotional understanding, sensory sensitivities (sound, light, food texture). | Scored directly (0-10). Identifies emotional and sensory processing styles. |
| **Social / Peer Problems** | Interest in peers, making friends, solitary play, social impact. | Scored directly (0-10). Evaluates peer integration. |

### Diagnostic Risk Classification
The Total Difficulties Score (0–40) is calculated by summing the scores of the emotional, conduct, hyperactivity, and peer subscales. The clinical ranges are:
* **Normal Range**: `0 - 14` (Low probability of clinical indicators)
* **Borderline Range**: `15 - 19` (Moderate indicators present; monitor closely)
* **Abnormal / Clinical Range**: `20 - 40` (Strong ASD indicators; recommends specialist consultation)

---

## How the Machine Learning Model Works

### 1. Training Pipeline & Datasets
The image screening model is built on **YOLOv8 (You Only Look Once)** object detection.
* **Training Platform**: Model trained using custom Roboflow datasets (`autism-detection-age-3-5-3gjk8/2`) mapping facial coordinates and bounding boxes.
* **Class Mapping**:
  * Class `0` $\to$ `Autism`
  * Class `1` $\to$ `Non-Autism`
* **Performance Results**:
  * **Precision**: ~94.8% on target behavioral indicators.
  * **Weighted Sensitivity**: Balanced performance across typical and atypical child datasets.

### 2. API Execution Logic
1. **Media Upload**: Parent uploads a child image to the `/vision/analyze` endpoint.
2. **Inference**: Flask writes the bytes to a temp file and runs inference with `yolo_model.predict(source=temp_path, conf=0.25)`.
3. **Risk Computation**: Evaluates class overlaps:
   * If `Autism` confidence is greater than `Non-Autism`, the score equals the `Autism` probability.
   * If `Non-Autism` is higher, the risk score is `(1.0 - Non-Autism)`.
4. **Classification**:
   * Risk Score `< 40.0%`: Classified as **Safe**.
   * Risk Score `40.0% - 70.0%`: Classified as **Moderate**.
   * Risk Score `> 70.0%`: Classified as **At Risk**.
5. **Database Sync**: The resulting score, detection tags, and summaries are saved to Firestore, linked to the child profile.

---

## Database Schema Design (Firebase Firestore REST)

The system communicates with Firebase Firestore via REST API endpoints. The database contains several primary collections:

### 1. `patients` Collection
```json
{
  "id": "child-12345",
  "parent_id": "user-abcde",
  "name": "Alex Smith",
  "dob": "2022-04-12",
  "sex": "male",
  "created_at": "2026-08-27T12:00:00Z"
}
```

### 2. `sdq_submissions` Collection
```json
{
  "id": "sdq-67890",
  "child_id": "child-12345",
  "responses": { "1": 2, "2": 2, "6": 0, "15": 1 },
  "subscale_scores": {
    "emotional": 2,
    "conduct": 1,
    "hyperactivity": 0,
    "peer": 1,
    "prosocial": 10
  },
  "total_difficulties_score": 4,
  "band": "close_to_average",
  "priority": "normal",
  "submitted_at": "2026-08-27T12:05:00Z"
}
```

### 3. `folders` Collection
```json
{
  "id": "folder-f1a2b3",
  "user_id": "user-abcde",
  "child_id": "child-12345",
  "name": "Clinical Therapy Reports",
  "created_at": "2026-08-27T12:10:00Z"
}
```

---

## Project Structure

```
Autism-detection-system/
│
├── 📁 server/                           # Python Flask Backend
│   ├── run.py                           # Flask server entry point (Register blueprints & CORS)
│   ├── eda.ipynb                        # Jupyter Notebook containing dataset exploration & YOLO config
│   │
│   ├── 📁 app/                          # Core application package
│   │   ├── __init__.py
│   │   ├── config.py                    # App configuration settings
│   │   ├── db.py                        # Firestore REST connector (supporting compound filtering)
│   │   ├── security.py                  # Password hashing (bcrypt) & JWT operations
│   │   ├── email_service.py             # Event schedule automated email reminder service
│   │   │
│   │   ├── 📁 models/                   # Python models
│   │   │   └── sdq_scoring.py           # Questionnaire scoring algorithms & clinical cutoffs
│   │   │
│   │   └── 📁 routers/                  # API blueprint controllers
│   │       ├── auth.py                  # Parent authentication controller
│   │       ├── patients.py              # Child profiles controller
│   │       ├── sdq.py                   # Questionnaire router
│   │       ├── vision.py                # YOLOv8 Computer Vision controller
│   │       ├── health.py                # Milestones, growth, and sleep controller
│   │       ├── events.py                # Calendar events & email reminders controller
│   │       └── documents.py             # Document vault folder/file controller
│   │
│   └── 📁 models/                       # Stored model assets
│       └── autism_yolo_model.pt         # Trained YOLOv8 object detection weights
│
├── 📁 Client/                           # React + Vite Frontend App
│   ├── index.html                       # HTML base template
│   ├── vite.config.js                   # Vite configuration
│   ├── eslint.config.js                 # Linter configuration
│   │
│   └── 📁 src/                          # Application source code
│       ├── main.jsx                     # Rendering entry point
│       ├── App.jsx                      # App routes, global context wrappers, and page routing
│       ├── index.css                    # Design system classes
│       │
│       ├── 📁 lib/                      # Core helpers
│       │   ├── api.js                   # API wrapper client (login, register, CRUD)
│       │   ├── firebase.js              # Client Firebase credentials config
│       │   └── utils.js                 # Tailwind class merger
│       │
│       ├── 📁 hooks/                    # Custom hooks
│       │   ├── useAuth.jsx              # JWT user session context
│       │   ├── usePatients.jsx          # Children profile state provider
│       │   └── useTheme.jsx             # UI Dark/Light mode theme state
│       │
│       ├── 📁 pages/                    # Routable page views
│       │   ├── Home.jsx                 # Landing page
│       │   ├── DashboardPage.jsx        # Dashboard metrics overview (with skeleton loader)
│       │   ├── SdqPage.jsx              # Stepper-based Autism Screening Questionnaire
│       │   ├── VisionPage.jsx           # YOLOv8 Visual inference analysis uploader
│       │   ├── HealthTrackerPage.jsx    # Chart dashboards for sleep, growth, and milestones
│       │   ├── DocumentLibraryPage.jsx  # Isolated document folders & PDF clinical report generator
│       │   ├── EventManagementPage.jsx  # Child-isolated calendar event scheduler
│       │   └── UserProfilePage.jsx      # Parent credentials manager
│       │
│       └── 📁 components/               # UI components
│           ├── 📁 Layout/
│           │   ├── DashboardLayout.jsx  # App shell wrapper containing sidebar & notification scanner
│           │   └── Sidebar.jsx          # Collapsible navigation drawer
│           ├── 📁 ui/
│           │   ├── Stepper.jsx          # Stepper slider
│           │   ├── toast.jsx            # Custom visual warning, success, and info alerts
│           │   └── GradientButton.jsx   # Visual CTA button
│
└── 📄 README.md                         # Project documentation
