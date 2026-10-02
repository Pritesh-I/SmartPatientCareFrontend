import { useState, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:8080/api'
const DOCTOR_ID = 1

function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const login = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setMessage(data.message || 'Login failed')
        return
      }

      setUser(data)
    } catch (error) {
      setMessage('Cannot connect to backend.')
    }
  }

  const logout = () => {
    setUser(null)
    setUsername('')
    setPassword('')
  }

  if (!user) {
    return (
      <div className="app">
        <div className="login-card">
          <h1>🏥 Smart Patient Care</h1>
          <p>Login to continue</p>

          <form onSubmit={login}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">LOGIN</button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    )
  }

  return user.role === 'DOCTOR' ? (
    <DoctorApp user={user} logout={logout} />
  ) : user.role === 'ASSISTANT' ? (
    <AssistantApp user={user} logout={logout} />
  ) : (
    <PatientApp user={user} logout={logout} />
  )
}

/* =========================
   DOCTOR APP
========================= */


function AssistantApp({ user, logout }) {
  const [page, setPage] = useState('dashboard')

  const [queue, setQueue] = useState([])
  const [consultations, setConsultations] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [refills, setRefills] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [patientId, setPatientId] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [consultationNotes, setConsultationNotes] = useState('')
  const [treatmentSummary, setTreatmentSummary] = useState('')

  const [prescriptionPatientId, setPrescriptionPatientId] = useState('')
  const [prescriptionConsultationId, setPrescriptionConsultationId] = useState('')
  const [medicineName, setMedicineName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [instructions, setInstructions] = useState('')

  const [followUpPatientId, setFollowUpPatientId] = useState('')
  const [followUpConsultationId, setFollowUpConsultationId] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpReason, setFollowUpReason] = useState('')
  const [followUpNotes, setFollowUpNotes] = useState('')

  const DOCTOR_ID = 1

  const loadData = async () => {
    setLoading(true)

    try {
      const [q, c, p, f, r] = await Promise.all([
        fetch(`${API}/queue/today`).then(x => x.json()),
        fetch(`${API}/consultations/doctor/${DOCTOR_ID}`).then(x => x.json()),
        fetch(`${API}/prescriptions/doctor/${DOCTOR_ID}`).then(x => x.json()),
        fetch(`${API}/follow-ups/doctor/${DOCTOR_ID}`).then(x => x.json()),
        fetch(`${API}/medicine-refills/doctor/${DOCTOR_ID}`).then(x => x.json())
      ])

      setQueue(Array.isArray(q) ? q : [])
      setConsultations(Array.isArray(c) ? c : [])
      setPrescriptions(Array.isArray(p) ? p : [])
      setFollowUps(Array.isArray(f) ? f : [])
      setRefills(Array.isArray(r) ? r : [])
    } catch {
      setMessage('Unable to load hospital data.')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateQueue = async (id, status) => {
    try {
      await fetch(`${API}/queue/${id}/status?status=${status}`, {
        method: 'PUT'
      })

      setMessage(`Token successfully moved to ${status}.`)
      loadData()
    } catch {
      setMessage('Queue update failed.')
    }
  }

  const updateRefill = async (id, status) => {
    try {
      await fetch(`${API}/medicine-refills/${id}/status?status=${status}`, {
        method: 'PUT'
      })

      setMessage(`Refill request marked ${status}.`)
      loadData()
    } catch {
      setMessage('Refill update failed.')
    }
  }

  const submitConsultation = async (e) => {
    e.preventDefault()

    if (!patientId.trim()) {
      setMessage('Enter the patient ID.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${API}/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: Number(patientId),
          doctorId: DOCTOR_ID,
          diagnosis: diagnosis.trim(),
          notes: consultationNotes.trim(),
          prescription: treatmentSummary.trim(),
          status: 'PENDING_APPROVAL'
        })
      })

      if (!response.ok) {
        throw new Error()
      }

      setMessage('Clinical instructions recorded and sent to the doctor for approval.')

      setPatientId('')
      setDiagnosis('')
      setConsultationNotes('')
      setTreatmentSummary('')

      await loadData()
    } catch {
      setMessage('Unable to save clinical instructions.')
    }

    setSaving(false)
  }

  const submitPrescription = async (e) => {
    e.preventDefault()

    if (!prescriptionPatientId.trim() || !medicineName.trim()) {
      setMessage('Patient ID and medicine name are required.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${API}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: Number(prescriptionPatientId),
          doctorId: DOCTOR_ID,
          consultationId: prescriptionConsultationId
            ? Number(prescriptionConsultationId)
            : null,
          medicineName: medicineName.trim(),
          dosage: dosage.trim(),
          frequency: frequency.trim(),
          duration: duration.trim(),
          instructions: instructions.trim(),
          status: 'PENDING_APPROVAL'
        })
      })

      if (!response.ok) {
        throw new Error()
      }

      setMessage('Prescription recorded and sent to the doctor for approval.')

      setPrescriptionPatientId('')
      setPrescriptionConsultationId('')
      setMedicineName('')
      setDosage('')
      setFrequency('')
      setDuration('')
      setInstructions('')

      await loadData()
    } catch {
      setMessage('Unable to save prescription.')
    }

    setSaving(false)
  }

  const submitFollowUp = async (e) => {
    e.preventDefault()

    if (!followUpPatientId.trim() || !followUpDate) {
      setMessage('Patient ID and follow-up date are required.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${API}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: Number(followUpPatientId),
          doctorId: DOCTOR_ID,
          consultationId: followUpConsultationId
            ? Number(followUpConsultationId)
            : null,
          followUpDate,
          reason: followUpReason.trim(),
          notes: followUpNotes.trim(),
          status: 'PENDING_APPROVAL'
        })
      })

      if (!response.ok) {
        throw new Error()
      }

      setMessage('Follow-up recorded and sent to the doctor for approval.')

      setFollowUpPatientId('')
      setFollowUpConsultationId('')
      setFollowUpDate('')
      setFollowUpReason('')
      setFollowUpNotes('')

      await loadData()
    } catch {
      setMessage('Unable to save follow-up.')
    }

    setSaving(false)
  }

  const goHome = () => {
    setPage('dashboard')
    setMessage('')
  }

  const pendingConsultations = consultations.filter(
    item => item.status === 'PENDING_APPROVAL'
  )

  const pendingPrescriptions = prescriptions.filter(
    item => item.status === 'PENDING_APPROVAL'
  )

  const pendingFollowUps = followUps.filter(
    item => item.status === 'PENDING_APPROVAL'
  )

  return (
    <div className="app">

      <header className="topbar">
        <div>
          <h1>🏥 Smart Patient Care</h1>
          <p>Medical Assistant • Hospital Operations</p>
        </div>

        <div className="button-row">
          {page !== 'dashboard' && (
            <button onClick={goHome}>Dashboard</button>
          )}

          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="container">

        {message && (
          <div className="success-message">
            ✅ {message}
          </div>
        )}

        {page === 'dashboard' && (
          <div className="assistant-home">

            {/* Welcome */}
            <section className="assistant-welcome">
              <div>
                <span className="assistant-label">MEDICAL ASSISTANT</span>
                <h2>Welcome to your workspace</h2>
                <p>
                  Manage patient operations and coordinate clinical information
                  with the doctor.
                </p>
              </div>
            </section>

            {/* Overview */}
            <section className="assistant-overview">
              <div className="assistant-heading">
                <div>
                  <span className="assistant-label">TODAY</span>
                  <h2>Hospital Overview</h2>
                </div>

                <button
                  className="assistant-refresh-btn"
                  onClick={loadData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="assistant-overview-grid">

                <button
                  className="assistant-overview-card"
                  onClick={() => setPage('queue')}
                >
                  <span className="overview-title">TODAY'S QUEUE</span>
                  <strong>{queue.length}</strong>
                  <span className="overview-description">
                    Patient tokens
                  </span>
                </button>

                <button
                  className="assistant-overview-card"
                  onClick={() => setPage('consultations')}
                >
                  <span className="overview-title">CLINICAL INSTRUCTIONS</span>
                  <strong>{pendingConsultations.length}</strong>
                  <span className="overview-description">
                    Awaiting approval
                  </span>
                </button>

                <button
                  className="assistant-overview-card"
                  onClick={() => setPage('prescriptions')}
                >
                  <span className="overview-title">PRESCRIPTIONS</span>
                  <strong>{pendingPrescriptions.length}</strong>
                  <span className="overview-description">
                    Awaiting approval
                  </span>
                </button>

                <button
                  className="assistant-overview-card"
                  onClick={() => setPage('followups')}
                >
                  <span className="overview-title">FOLLOW-UPS</span>
                  <strong>{pendingFollowUps.length}</strong>
                  <span className="overview-description">
                    Awaiting approval
                  </span>
                </button>

              </div>
            </section>

            {/* Work Areas */}
            <section className="assistant-workareas">
              <div className="assistant-heading">
                <div>
                  <span className="assistant-label">OPERATIONS</span>
                  <h2>Work Areas</h2>
                </div>
              </div>

              <div className="assistant-work-grid">

                <button
                  className="assistant-work-card"
                  onClick={() => setPage('queue')}
                >
                  <div className="work-card-number">01</div>
                  <div>
                    <h3>Patient Queue</h3>
                    <p>Manage today's tokens and patient flow.</p>
                  </div>
                  <span>→</span>
                </button>

                <button
                  className="assistant-work-card"
                  onClick={() => setPage('consultations')}
                >
                  <div className="work-card-number">02</div>
                  <div>
                    <h3>Clinical Instructions</h3>
                    <p>Record instructions given by the doctor.</p>
                  </div>
                  <span>→</span>
                </button>

                <button
                  className="assistant-work-card"
                  onClick={() => setPage('prescriptions')}
                >
                  <div className="work-card-number">03</div>
                  <div>
                    <h3>Prescriptions</h3>
                    <p>Enter prescription information for approval.</p>
                  </div>
                  <span>→</span>
                </button>

                <button
                  className="assistant-work-card"
                  onClick={() => setPage('followups')}
                >
                  <div className="work-card-number">04</div>
                  <div>
                    <h3>Follow-ups</h3>
                    <p>Schedule follow-up requests for patients.</p>
                  </div>
                  <span>→</span>
                </button>

                <button
                  className="assistant-work-card"
                  onClick={() => setPage('refills')}
                >
                  <div className="work-card-number">05</div>
                  <div>
                    <h3>Medicine Refills</h3>
                    <p>Process patient medicine refill requests.</p>
                  </div>
                  <span>→</span>
                </button>

              </div>
            </section>


          </div>
        )}

        {page === 'queue' && (
          <section className="page-section">
            <h2>👥 Today's Patient Queue</h2>

            {queue.length === 0 ? (
              <div className="empty-state">
                <h3>No patients waiting</h3>
                <p>New queue tokens will appear here automatically.</p>
              </div>
            ) : (
              queue.map(item => (
                <div className="data-card" key={item.id}>
                  <h3>🎫 Token #{item.tokenNumber}</h3>

                  <p><b>Patient ID:</b> {item.patientId}</p>
                  <p><b>Doctor ID:</b> {item.doctorId}</p>
                  <p><b>Room:</b> {item.room}</p>
                  <p><b>Status:</b> {item.status}</p>

                  <div className="button-row">
                    {item.status === 'WAITING' && (
                      <button
                        onClick={() => updateQueue(item.id, 'CALLED')}
                      >
                        📢 Call Patient
                      </button>
                    )}

                    {item.status === 'CALLED' && (
                      <button
                        onClick={() => updateQueue(item.id, 'SERVING')}
                      >
                        🩺 Start Consultation
                      </button>
                    )}

                    {item.status === 'SERVING' && (
                      <button
                        onClick={() => updateQueue(item.id, 'COMPLETED')}
                      >
                        ✅ Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {page === 'consultations' && (
          <section className="page-section">

            <h2>📝 Record Doctor's Clinical Instructions</h2>

            <div className="welcome-card">
              <p>
                The doctor gives the clinical instructions verbally.
                The assistant records them here. The record remains
                <b> PENDING APPROVAL </b> until the doctor reviews it.
              </p>
            </div>

            <form className="data-card" onSubmit={submitConsultation}>

              <h3>➕ New Clinical Instruction</h3>

              <label>Patient ID</label>
              <input
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="Example: 34"
                type="number"
              />

              <label>Diagnosis</label>
              <input
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="Example: Fever"
              />

              <label>Doctor's Notes</label>
              <textarea
                value={consultationNotes}
                onChange={e => setConsultationNotes(e.target.value)}
                placeholder="Record what the doctor instructed..."
                rows="4"
              />

              <label>Treatment Summary</label>
              <textarea
                value={treatmentSummary}
                onChange={e => setTreatmentSummary(e.target.value)}
                placeholder="Example: Continue medication and rest"
                rows="4"
              />

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : '📝 Send for Doctor Approval'}
              </button>

            </form>

            <h2>📋 Recent Clinical Instructions</h2>

            {consultations.length === 0 ? (
              <div className="empty-state">
                No clinical instructions found.
              </div>
            ) : (
              consultations.map(item => (
                <div className="data-card" key={item.id}>

                  <h3>🩺 Consultation #{item.id}</h3>

                  <p><b>Patient:</b> #{item.patientId}</p>

                  <p>
                    <b>Diagnosis:</b>{' '}
                    {item.diagnosis || 'Not specified'}
                  </p>

                  <p>
                    <b>Doctor Notes:</b>{' '}
                    {item.notes || 'No notes recorded'}
                  </p>

                  <p>
                    <b>Treatment:</b>{' '}
                    {item.prescription || 'No treatment summary'}
                  </p>

                  <span className="status-badge">
                    {item.status || 'LEGACY RECORD'}
                  </span>

                </div>
              ))
            )}

          </section>
        )}

        {page === 'prescriptions' && (
          <section className="page-section">

            <h2>💊 Prescription Coordination</h2>

            <div className="welcome-card">
              <p>
                Enter the prescription based on the doctor's instructions.
                The prescription is sent to the doctor for approval before
                it becomes visible to the patient.
              </p>
            </div>

            <form className="data-card" onSubmit={submitPrescription}>

              <h3>➕ New Prescription</h3>

              <label>Patient ID</label>
              <input
                type="number"
                value={prescriptionPatientId}
                onChange={e => setPrescriptionPatientId(e.target.value)}
                placeholder="Example: 34"
              />

              <label>Consultation ID</label>
              <input
                type="number"
                value={prescriptionConsultationId}
                onChange={e => setPrescriptionConsultationId(e.target.value)}
                placeholder="Example: 3"
              />

              <label>Medicine Name</label>
              <input
                value={medicineName}
                onChange={e => setMedicineName(e.target.value)}
                placeholder="Example: Paracetamol 500mg"
              />

              <label>Dosage</label>
              <input
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                placeholder="Example: 1 tablet"
              />

              <label>Frequency</label>
              <input
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                placeholder="Example: Twice daily"
              />

              <label>Duration</label>
              <input
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="Example: 5 days"
              />

              <label>Instructions</label>
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Example: Take after meals"
                rows="3"
              />

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : '💊 Send for Doctor Approval'}
              </button>

            </form>

            <h2>📋 Prescription Records</h2>

            {prescriptions.length === 0 ? (
              <div className="empty-state">
                No prescriptions found.
              </div>
            ) : (
              prescriptions.map(item => (
                <div className="data-card" key={item.id}>

                  <h3>💊 {item.medicineName}</h3>

                  <p><b>Patient:</b> #{item.patientId}</p>
                  <p><b>Consultation:</b> #{item.consultationId || '-'}</p>
                  <p><b>Dosage:</b> {item.dosage || '-'}</p>
                  <p><b>Frequency:</b> {item.frequency || '-'}</p>
                  <p><b>Duration:</b> {item.duration || '-'}</p>
                  <p><b>Instructions:</b> {item.instructions || '-'}</p>

                  <span className="status-badge">
                    {item.status || 'LEGACY RECORD'}
                  </span>

                </div>
              ))
            )}

          </section>
        )}

        {page === 'followups' && (
          <section className="page-section">

            <h2>📅 Follow-up Coordination</h2>

            <div className="welcome-card">
              <p>
                The assistant records the doctor's requested follow-up.
                The doctor must approve it before it is published to the
                patient.
              </p>
            </div>

            <form className="data-card" onSubmit={submitFollowUp}>

              <h3>➕ New Follow-up</h3>

              <label>Patient ID</label>
              <input
                type="number"
                value={followUpPatientId}
                onChange={e => setFollowUpPatientId(e.target.value)}
                placeholder="Example: 34"
              />

              <label>Consultation ID</label>
              <input
                type="number"
                value={followUpConsultationId}
                onChange={e => setFollowUpConsultationId(e.target.value)}
                placeholder="Example: 3"
              />

              <label>Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
              />

              <label>Reason</label>
              <input
                value={followUpReason}
                onChange={e => setFollowUpReason(e.target.value)}
                placeholder="Example: Diabetes review"
              />

              <label>Notes</label>
              <textarea
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                placeholder="Follow-up instructions..."
                rows="3"
              />

              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : '📅 Send for Doctor Approval'}
              </button>

            </form>

            <h2>📋 Follow-up Records</h2>

            {followUps.length === 0 ? (
              <div className="empty-state">
                No follow-ups found.
              </div>
            ) : (
              followUps.map(item => (
                <div className="data-card" key={item.id}>

                  <h3>📅 Patient #{item.patientId}</h3>

                  <p><b>Follow-up Date:</b> {item.followUpDate}</p>
                  <p><b>Reason:</b> {item.reason || '-'}</p>
                  <p><b>Notes:</b> {item.notes || '-'}</p>

                  <span className="status-badge">
                    {item.status || 'LEGACY RECORD'}
                  </span>

                </div>
              ))
            )}

          </section>
        )}

        {page === 'refills' && (
          <section className="page-section">

            <h2>🔄 Medicine Refill Requests</h2>

            <div className="welcome-card">
              <p>
                Process patient refill requests while keeping them linked
                to an existing prescription.
              </p>
            </div>

            {refills.length === 0 ? (
              <div className="empty-state">
                No refill requests found.
              </div>
            ) : (
              refills.map(item => (
                <div className="data-card" key={item.id}>

                  <h3>💊 {item.medicineName}</h3>

                  <p><b>Patient:</b> #{item.patientId}</p>
                  <p><b>Prescription:</b> #{item.prescriptionId}</p>
                  <p><b>Quantity:</b> {item.quantity}</p>
                  <p><b>Request Date:</b> {item.requestDate}</p>
                  <p><b>Notes:</b> {item.notes || '-'}</p>
                  <p><b>Status:</b> {item.status}</p>

                  {item.status === 'PENDING' && (
                    <div className="button-row">

                      <button
                        onClick={() => updateRefill(item.id, 'APPROVED')}
                      >
                        ✅ Approve Request
                      </button>

                      <button
                        onClick={() => updateRefill(item.id, 'REJECTED')}
                      >
                        ❌ Reject Request
                      </button>

                    </div>
                  )}

                </div>
              ))
            )}

          </section>
        )}

        {loading && (
          <div className="success-message">
            🔄 Loading latest hospital data...
          </div>
        )}

      </main>
    </div>
  )
}

function DoctorApp({ user, logout }) {
  const [page, setPage] = useState('dashboard')

  const overview = [
    {
      number: '01',
      title: 'Appointments',
      description: 'Review today’s scheduled patients.',
      target: 'appointments'
    },
    {
      number: '02',
      title: 'Clinical Approvals',
      description: 'Review clinical instructions entered by the assistant.',
      target: 'consultation'
    },
    {
      number: '03',
      title: 'Prescription Approvals',
      description: 'Approve treatment and medication details.',
      target: 'prescriptions'
    },
    {
      number: '04',
      title: 'Follow-up Approvals',
      description: 'Review proposed follow-up plans.',
      target: 'followups'
    }
  ]

  const workAreas = [
    {
      number: '01',
      title: 'Appointments',
      description: 'View and manage scheduled appointments.',
      target: 'appointments'
    },
    {
      number: '02',
      title: 'Today’s Patients',
      description: 'View patients scheduled with you.',
      target: 'patients'
    },
    {
      number: '03',
      title: 'Queue & Tokens',
      description: 'Monitor the hospital patient queue.',
      target: 'queue'
    },
    {
      number: '04',
      title: 'Clinical Approvals',
      description: 'Approve assistant-entered consultation records.',
      target: 'consultation'
    },
    {
      number: '05',
      title: 'Prescription Approvals',
      description: 'Approve medicines and treatment instructions.',
      target: 'prescriptions'
    },
    {
      number: '06',
      title: 'Follow-up Approvals',
      description: 'Approve patient follow-up plans.',
      target: 'followups'
    },
    {
      number: '07',
      title: 'Health Records',
      description: 'Review patient health information.',
      target: 'health'
    },
    {
      number: '08',
      title: 'Notifications',
      description: 'Review patient-care notifications.',
      target: 'notifications'
    }
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Smart Patient Care</h1>
          <p>Doctor Workspace</p>
        </div>

        <button onClick={logout}>LOGOUT</button>
      </header>

      <main>
        {page === 'dashboard' ? (
          <div className="doctor-home">

            <section className="doctor-welcome">
              <div>
                <span className="doctor-label">DOCTOR WORKSPACE</span>
                <h2>Welcome, {user.name}</h2>
                <p>
                  Review clinical information, approve treatment decisions,
                  and oversee patient care.
                </p>
              </div>
            </section>

            <section className="doctor-overview">
              <div className="doctor-heading">
                <div>
                  <span className="doctor-label">TODAY</span>
                  <h2>Clinical Overview</h2>
                </div>
              </div>

              <div className="doctor-overview-grid">
                {overview.map((item) => (
                  <button
                    key={item.target}
                    className="doctor-overview-card"
                    onClick={() => setPage(item.target)}
                  >
                    <span className="doctor-overview-number">
                      {item.number}
                    </span>

                    <strong>{item.title}</strong>

                    <span className="doctor-overview-description">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="doctor-workareas">
              <div className="doctor-heading">
                <div>
                  <span className="doctor-label">WORK AREAS</span>
                  <h2>Doctor Operations</h2>
                </div>
              </div>

              <div className="doctor-work-grid">
                {workAreas.map((item) => (
                  <button
                    key={item.target}
                    className="doctor-work-card"
                    onClick={() => setPage(item.target)}
                  >
                    <span className="doctor-work-number">
                      {item.number}
                    </span>

                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>

                    <span className="doctor-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>

            

          </div>
        ) : (
          <DoctorPage
            page={page}
            goBack={() => setPage('dashboard')}
            goToPage={setPage}
          />
        )}
      </main>
    </div>
  )
}


function DoctorPage({ page, goBack, goToPage }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const endpoint = {
    appointments: `/appointments/doctor/${DOCTOR_ID}`,
    patients: `/appointments/doctor/${DOCTOR_ID}`,
    queue: '/queue/today',
    consultation: `/consultations/doctor/${DOCTOR_ID}/pending`,
    prescriptions: `/prescriptions/doctor/${DOCTOR_ID}/pending`,
    followups: `/follow-ups/doctor/${DOCTOR_ID}/pending`,
    health: '/health-records/patient/3',
    notifications: '/notifications/user/3'
  }[page]

  const load = async () => {
    if (!endpoint) return

    setLoading(true)
    setActionMessage('')

    try {
      const response = await fetch(`${API}${endpoint}`)
      const result = await response.json()

      if (!response.ok) {
        setData([])
        setActionMessage('Unable to load this section.')
        return
      }

      setData(Array.isArray(result) ? result : [result])
    } catch {
      setData([])
      setActionMessage('Cannot connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const updateAppointment = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/appointments/${id}/status?status=${status}`,
        { method: 'PUT' }
      )

      const result = await response.json()

      if (response.ok) {
        setActionMessage(`Appointment marked ${status}.`)
        load()
      } else {
        setActionMessage(result.message || 'Update failed.')
      }
    } catch {
      setActionMessage('Cannot connect to backend.')
    }
  }

  const updateQueue = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/queue/${id}/status?status=${status}`,
        { method: 'PUT' }
      )

      if (response.ok) {
        setActionMessage(`Token ${status}.`)
        load()
      } else {
        setActionMessage('Queue update failed.')
      }
    } catch {
      setActionMessage('Cannot connect to backend.')
    }
  }

  const updateApproval = async (type, id, status) => {
    const endpointMap = {
      consultation: `/consultations/${id}/status?status=${status}`,
      prescriptions: `/prescriptions/${id}/status?status=${status}`,
      followups: `/follow-ups/${id}/status?status=${status}`
    }

    try {
      const response = await fetch(`${API}${endpointMap[type]}`, {
        method: 'PUT'
      })

      const result = await response.json()

      if (!response.ok) {
        setActionMessage(
          result.message || `Could not ${status.toLowerCase()} item.`
        )
        return
      }

      setActionMessage(
        `${type === 'consultation'
          ? 'Consultation'
          : type === 'prescriptions'
            ? 'Prescription'
            : 'Follow-up'} ${status.toLowerCase()} successfully.`
      )

      load()
    } catch {
      setActionMessage('Cannot connect to backend.')
    }
  }

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '—'
    }

    return String(value)
  }

  const renderField = (label, value) => (
    <div className="doctor-detail">
      <span>{label}</span>
      <strong>{renderValue(value)}</strong>
    </div>
  )

  const renderApprovalCard = (item, type) => {
    const isConsultation = type === 'consultation'
    const isPrescription = type === 'prescriptions'

    return (
      <article className="doctor-approval-card" key={item.id}>

        <div className="doctor-approval-header">
          <div>
            <span className="doctor-card-label">
              {isConsultation
                ? 'CLINICAL INSTRUCTION'
                : isPrescription
                  ? 'TREATMENT REQUEST'
                  : 'FOLLOW-UP REQUEST'}
            </span>

            <h3>
              {isConsultation
                ? 'Clinical Consultation'
                : isPrescription
                  ? 'Prescription'
                  : 'Follow-up Plan'}
            </h3>
          </div>

          <span className="doctor-status">
            {renderValue(item.status)}
          </span>
        </div>

        <div className="doctor-patient-strip">
          <div>
            <span>Patient ID</span>
            <strong>{renderValue(item.patientId)}</strong>
          </div>

          <div>
            <span>Doctor ID</span>
            <strong>{renderValue(item.doctorId)}</strong>
          </div>

          <div>
            <span>Record ID</span>
            <strong>{renderValue(item.id)}</strong>
          </div>
        </div>

        {isConsultation && (
          <>
            <div className="doctor-section-block">
              <span className="doctor-section-label">CLINICAL INFORMATION</span>

              <div className="doctor-detail-grid">
                {renderField('Diagnosis', item.diagnosis)}
                {renderField('Consultation Date', item.consultationDate)}
              </div>
            </div>

            <div className="doctor-text-block">
              <span>Clinical Notes</span>
              <p>{renderValue(item.notes)}</p>
            </div>

            <div className="doctor-text-block">
              <span>Treatment / Prescription Summary</span>
              <p>{renderValue(item.prescription)}</p>
            </div>
          </>
        )}

        {isPrescription && (
          <>
            <div className="doctor-section-block">
              <span className="doctor-section-label">MEDICATION DETAILS</span>

              <div className="doctor-detail-grid">
                {renderField('Medicine', item.medicineName)}
                {renderField('Dosage', item.dosage)}
                {renderField('Frequency', item.frequency)}
                {renderField('Duration', item.duration)}
                {renderField('Consultation ID', item.consultationId)}
                {renderField('Prescribed Date', item.prescribedDate)}
              </div>
            </div>

            <div className="doctor-text-block">
              <span>Instructions</span>
              <p>{renderValue(item.instructions)}</p>
            </div>
          </>
        )}

        {!isConsultation && !isPrescription && (
          <>
            <div className="doctor-section-block">
              <span className="doctor-section-label">FOLLOW-UP DETAILS</span>

              <div className="doctor-detail-grid">
                {renderField('Follow-up Date', item.followUpDate)}
                {renderField('Consultation ID', item.consultationId)}
              </div>
            </div>

            <div className="doctor-text-block">
              <span>Reason</span>
              <p>{renderValue(item.reason)}</p>
            </div>

            <div className="doctor-text-block">
              <span>Notes</span>
              <p>{renderValue(item.notes)}</p>
            </div>
          </>
        )}

        {item.status === 'PENDING_APPROVAL' && (
          <div className="doctor-approval-actions">

            <button
              className="doctor-approve-btn"
              onClick={() => updateApproval(type, item.id, 'APPROVED')}
            >
              APPROVE
            </button>

            <button
              className="doctor-reject-btn"
              onClick={() => updateApproval(type, item.id, 'REJECTED')}
            >
              REJECT
            </button>

          </div>
        )}

      </article>
    )
  }

  const pageDescriptions = {
    consultation:
      'Review clinical instructions entered by the medical assistant before they become available to the patient.',
    prescriptions:
      'Review medication, dosage and treatment instructions before releasing them to the patient.',
    followups:
      'Review the follow-up plan prepared by the medical assistant before it becomes visible to the patient.',
    appointments:
      'Review and manage appointments scheduled with you.',
    patients:
      'View patients who have appointments with you.',
    queue:
      'Monitor today’s patient queue and consultation progress.',
    health:
      'Review available patient health information.',
    notifications:
      'Review patient-care notifications.'
  }

  const titleMap = {
    consultation: 'Clinical Approvals',
    prescriptions: 'Prescription Approvals',
    followups: 'Follow-up Approvals',
    appointments: 'Appointments',
    patients: 'Today’s Patients',
    queue: 'Queue & Tokens',
    health: 'Health Records',
    notifications: 'Notifications'
  }

  return (
    <div className="doctor-page">

      <div className="doctor-page-topbar">
        <button className="doctor-back-btn" onClick={goBack}>
          ← BACK
        </button>

        <button className="doctor-refresh-btn" onClick={load}>
          {loading ? 'REFRESHING...' : 'REFRESH'}
        </button>
      </div>

      <section className="doctor-page-heading">
        <span className="doctor-label">DOCTOR WORKSPACE</span>

        <h2>{titleMap[page] || getDoctorPageTitle(page)}</h2>

        <p>
          {pageDescriptions[page] || 'Manage hospital data from one place.'}
        </p>
      </section>

      {actionMessage && (
        <div className="doctor-message">
          {actionMessage}
        </div>
      )}

      {loading && (
        <div className="doctor-loading">
          Loading information...
        </div>
      )}

      {!loading && page === 'consultation' && (
        <section className="doctor-approval-section">

          <div className="doctor-workflow-note">
            <span className="doctor-card-label">APPROVAL WORKFLOW</span>
            <strong>Review before patient access</strong>
            <p>
              The medical assistant records the clinical information provided
              by the doctor. The doctor reviews this information and gives the
              final approval before it is shared with the patient.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No pending clinical approvals</strong>
              <p>
                New assistant-entered clinical instructions will appear here.
              </p>
            </div>
          ) : (
            <div className="doctor-approval-list">
              {data.map(item => renderApprovalCard(item, 'consultation'))}
            </div>
          )}

        </section>
      )}

      {!loading && page === 'prescriptions' && (
        <section className="doctor-approval-section">

          <div className="doctor-workflow-note">
            <span className="doctor-card-label">TREATMENT APPROVAL</span>
            <strong>Prescription requires doctor approval</strong>
            <p>
              Review the medicine, dosage, frequency, duration and instructions.
              Only approved prescriptions are released to the patient.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No pending prescription approvals</strong>
              <p>
                New prescription requests will appear here.
              </p>
            </div>
          ) : (
            <div className="doctor-approval-list">
              {data.map(item => renderApprovalCard(item, 'prescriptions'))}
            </div>
          )}

        </section>
      )}

      {!loading && page === 'followups' && (
        <section className="doctor-approval-section">

          <div className="doctor-workflow-note">
            <span className="doctor-card-label">FOLLOW-UP APPROVAL</span>
            <strong>Review the proposed follow-up plan</strong>
            <p>
              Check the follow-up date, reason and notes before the plan
              becomes visible to the patient.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No pending follow-up approvals</strong>
              <p>
                New follow-up requests will appear here.
              </p>
            </div>
          ) : (
            <div className="doctor-approval-list">
              {data.map(item => renderApprovalCard(item, 'followups'))}
            </div>
          )}

        </section>
      )}

      {!loading && (page === 'appointments' || page === 'patients') && (
        <section className="doctor-list-section">

          <div className="doctor-list-heading">
            <span className="doctor-card-label">SCHEDULE</span>
            <h3>Appointments</h3>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No appointments found</strong>
              <p>Scheduled appointments will appear here.</p>
            </div>
          ) : (
            <div className="doctor-record-list">

              {data.map(item => (
                <article className="doctor-record-card" key={item.id}>

                  <div className="doctor-record-header">
                    <div>
                      <span>APPOINTMENT</span>
                      <h3>Appointment #{renderValue(item.id)}</h3>
                    </div>

                    <span className="doctor-status">
                      {renderValue(item.status)}
                    </span>
                  </div>

                  <div className="doctor-detail-grid">
                    {renderField('Patient ID', item.patientId)}
                    {renderField('Date', item.appointmentDate)}
                    {renderField('Time', item.appointmentTime)}
                    {renderField('Reason', item.reason)}
                  </div>

                  <div className="doctor-text-block">
                    <span>Notes</span>
                    <p>{renderValue(item.notes)}</p>
                  </div>

                  {item.status === 'PENDING' && (
                    <div className="doctor-approval-actions">

                      <button
                        className="doctor-approve-btn"
                        onClick={() =>
                          updateAppointment(item.id, 'CONFIRMED')
                        }
                      >
                        CONFIRM APPOINTMENT
                      </button>

                      <button
                        className="doctor-reject-btn"
                        onClick={() =>
                          updateAppointment(item.id, 'CANCELLED')
                        }
                      >
                        CANCEL
                      </button>

                    </div>
                  )}

                </article>
              ))}

            </div>
          )}

        </section>
      )}

      {!loading && page === 'queue' && (
        <section className="doctor-list-section">

          <div className="doctor-list-heading">
            <span className="doctor-card-label">PATIENT FLOW</span>
            <h3>Today’s Queue</h3>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No queue tokens today</strong>
              <p>Patient tokens will appear here during the day.</p>
            </div>
          ) : (
            <div className="doctor-record-list">

              {data.map(item => (
                <article className="doctor-record-card" key={item.id}>

                  <div className="doctor-record-header">
                    <div>
                      <span>TOKEN</span>
                      <h3>
                        Token #{renderValue(item.tokenNumber)}
                      </h3>
                    </div>

                    <span className="doctor-status">
                      {renderValue(item.status)}
                    </span>
                  </div>

                  <div className="doctor-detail-grid">
                    {renderField('Patient ID', item.patientId)}
                    {renderField('Doctor ID', item.doctorId)}
                    {renderField('Room', item.roomNumber)}
                    {renderField('Queue Date', item.queueDate)}
                  </div>

                  {item.status === 'WAITING' && (
                    <div className="doctor-action-single">
                      <button
                        className="doctor-approve-btn"
                        onClick={() =>
                          updateQueue(item.id, 'CALLED')
                        }
                      >
                        CALL PATIENT
                      </button>
                    </div>
                  )}

                  {item.status === 'CALLED' && (
                    <div className="doctor-action-single">
                      <button
                        className="doctor-approve-btn"
                        onClick={() =>
                          updateQueue(item.id, 'IN_CONSULTATION')
                        }
                      >
                        START CONSULTATION
                      </button>
                    </div>
                  )}

                  {item.status === 'IN_CONSULTATION' && (
                    <div className="doctor-action-single">
                      <button
                        className="doctor-approve-btn"
                        onClick={() =>
                          updateQueue(item.id, 'COMPLETED')
                        }
                      >
                        COMPLETE CONSULTATION
                      </button>
                    </div>
                  )}

                </article>
              ))}

            </div>
          )}

        </section>
      )}

      {!loading && page === 'health' && (
        <section className="doctor-list-section">

          <div className="doctor-list-heading">
            <span className="doctor-card-label">PATIENT DATA</span>
            <h3>Patient Health Record</h3>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No health record found</strong>
              <p>No health information is currently available.</p>
            </div>
          ) : (
            <div className="doctor-record-list">

              {data.map((item, index) => (
                <article
                  className="doctor-record-card"
                  key={item.id || index}
                >

                  <div className="doctor-detail-grid">
                    {renderField('Patient ID', item.patientId)}
                    {renderField('Heart Rate', item.heartRate)}
                    {renderField('Temperature', item.temperature)}
                    {renderField('Oxygen Level', item.oxygenLevel)}
                    {renderField('Weight', item.weight)}
                    {renderField('Blood Pressure', item.bloodPressure)}
                    {renderField('Recorded At', item.recordedAt)}
                  </div>

                </article>
              ))}

            </div>
          )}

        </section>
      )}

      {!loading && page === 'notifications' && (
        <section className="doctor-list-section">

          <div className="doctor-list-heading">
            <span className="doctor-card-label">SYSTEM UPDATES</span>
            <h3>Notifications</h3>
          </div>

          {data.length === 0 ? (
            <div className="doctor-empty">
              <strong>No notifications found</strong>
              <p>Patient-care notifications will appear here.</p>
            </div>
          ) : (
            <div className="doctor-record-list">

              {data.map((item, index) => (
                <article
                  className="doctor-record-card"
                  key={item.id || index}
                >

                  <div className="doctor-record-header">
                    <div>
                      <span>NOTIFICATION</span>
                      <h3>
                        {renderValue(item.title || 'Notification')}
                      </h3>
                    </div>
                  </div>

                  <div className="doctor-text-block">
                    <span>Message</span>
                    <p>{renderValue(item.message)}</p>
                  </div>

                  <small className="doctor-notification-date">
                    {renderValue(item.createdAt)}
                  </small>

                </article>
              ))}

            </div>
          )}

        </section>
      )}

    </div>
  )
}


function getDoctorPageTitle(page) {
  const titles = {
    patients: "👥 Today's Patients",
    appointments: '📅 Appointments',
    queue: '🎫 Queue / Tokens',
    health: '❤️ Health Records',
    consultation: '📝 Consultations',
    prescriptions: '💊 Prescriptions',
    followups: '📆 Follow-ups',
    notifications: '🔔 Notifications'
  }

  return titles[page] || 'Doctor Dashboard'
}


function PatientApp({ user, logout }) {
  const [page, setPage] = useState('dashboard')

  const cards = [
    {
      icon: '📅',
      title: 'Appointments',
      target: 'appointments',
      description: 'Book and manage your doctor appointments.',
      label: 'Appointments'
    },
    {
      icon: '🎫',
      title: 'Queue Status',
      target: 'queue',
      description: 'Check your token and see your waiting status.',
      label: 'Queue'
    },
    {
      icon: '❤️',
      title: 'Health Records',
      target: 'health',
      description: 'View your latest health information and vital records.',
      label: 'Health'
    },
    {
      icon: '💊',
      title: 'Prescriptions',
      target: 'prescriptions',
      description: 'View medicines prescribed by your doctor.',
      label: 'Medicines'
    },
    {
      icon: '📆',
      title: 'Follow-ups',
      target: 'followups',
      description: 'Check upcoming and completed follow-up visits.',
      label: 'Follow-up'
    },
    {
      icon: '🔄',
      title: 'Medicine Refill',
      target: 'refills',
      description: 'Request and track your medicine refills.',
      label: 'Refill'
    }
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>🏥 Smart Patient Care</h1>
          <p>Your personal healthcare companion</p>
        </div>
        <button onClick={logout}>LOGOUT</button>
      </header>

      <main>
        {page === 'dashboard' ? (
          <>
            <div className="welcome-card patient-welcome">
              <div>
                <span className="welcome-label">PATIENT PORTAL</span>
                <h2>Welcome, {user.name} 👋</h2>
                <p>
                  Manage your appointments, health records, prescriptions
                  and follow-ups from one place.
                </p>
              </div>
              <div className="welcome-icon">❤️</div>
            </div>

            <div className="section-title">
              <h2>Healthcare at your fingertips</h2>
              <p>Select a service to continue.</p>
            </div>

            <div className="patient-grid">
              {cards.map((card) => (
                <div className="patient-card" key={card.target}>
                  <div className="patient-card-top">
                    <div className="patient-icon">{card.icon}</div>
                    <span className="patient-badge">{card.label}</span>
                  </div>

                  <h3>{card.title}</h3>

                  <p>{card.description}</p>

                  <button
                    className="patient-open"
                    onClick={() => setPage(card.target)}
                  >
                    OPEN <span>→</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="info-card patient-info">
              <div>
                <strong>💙 Your health, organized</strong>
                <p>
                  Keep track of your care journey and stay connected
                  with your healthcare team.
                </p>
              </div>
            </div>
          </>
        ) : (
          <PatientPage
            page={page}
            patientId={user.userId}
            goBack={() => setPage('dashboard')}
          />
        )}
      </main>
    </div>
  )
}


function RefillCalendar({ doctorVisits, refillHistory, nextRefills }) {
  const [selectedDate, setSelectedDate] = useState('')

  const today = new Date()

  const dateKey = (date) => {
    if (!date) return ''

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-')
  }

  const formatDate = (value) => {
    if (!value) return 'Date unavailable'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable'
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const eventsForDate = (date) => {
    if (!date) return []

    const key = dateKey(date)
    const events = []

    doctorVisits.forEach((visit) => {
      if (
        String(visit.appointmentDate).slice(0, 10) === key
      ) {
        events.push({
          type: 'visit',
          item: visit
        })
      }
    })

    refillHistory.forEach((refill) => {
      if (
        String(refill.requestDate).slice(0, 10) === key
      ) {
        events.push({
          type: 'refill',
          item: refill
        })
      }
    })

    nextRefills.forEach((refill) => {
      if (dateKey(refill.date) === key) {
        events.push({
          type: 'next',
          item: refill.prescription
        })
      }
    })

    return events
  }

  const year = today.getFullYear()
  const month = today.getMonth()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day))
  }

  const activeDate = selectedDate || dateKey(today)
  const selectedEvents = eventsForDate(new Date(activeDate))

  return (
    <div
      className="data-card"
      style={{ marginTop: '16px' }}
    >
      <div className="page-heading">
        <h3>
          📅{' '}
          {today.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric'
          })}
        </h3>

        <p>
          Tap a date to see doctor visits and refill events.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '5px'
        }}
      >
        {[
          'SUN',
          'MON',
          'TUE',
          'WED',
          'THU',
          'FRI',
          'SAT'
        ].map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 700,
              padding: '5px 0'
            }}
          >
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                style={{ minHeight: '60px' }}
              />
            )
          }

          const key = dateKey(date)
          const events = eventsForDate(date)
          const isToday = key === dateKey(today)
          const isSelected = key === activeDate

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(key)}
              style={{
                minHeight: '60px',
                padding: '5px',
                borderRadius: '9px',
                border: isSelected
                  ? '2px solid #2563eb'
                  : '1px solid #dbe3ef',
                background: isToday
                  ? '#eff6ff'
                  : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <strong>{date.getDate()}</strong>

              <div
                style={{
                  marginTop: '5px',
                  display: 'flex',
                  gap: '2px'
                }}
              >
                {events.some(
                  (event) => event.type === 'visit'
                ) && <span>🩺</span>}

                {events.some(
                  (event) => event.type === 'refill'
                ) && <span>💊</span>}

                {events.some(
                  (event) => event.type === 'next'
                ) && <span>🔵</span>}
              </div>
            </button>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          marginTop: '15px',
          fontSize: '13px'
        }}
      >
        <span>🩺 Doctor Visit</span>
        <span>💊 Previous Refill</span>
        <span>🔵 Refill Due</span>
      </div>

      <div
        className="data-card"
        style={{ marginTop: '16px' }}
      >
        <h3>
          📍 Events on {formatDate(activeDate)}
        </h3>

        {selectedEvents.length === 0 ? (
          <p>No events on this date.</p>
        ) : (
          selectedEvents.map((event, index) => (
            <div
              className="appointment-record"
              key={`${event.type}-${index}`}
            >
              <div className="appointment-record-top">
                <div>
                  <span className="appointment-label">
                    {event.type === 'visit'
                      ? 'DOCTOR VISIT'
                      : event.type === 'refill'
                      ? 'REFILL REQUEST'
                      : 'REFILL DUE'}
                  </span>

                  <h3>
                    {event.type === 'visit'
                      ? '🩺 Doctor Visit'
                      : event.type === 'refill'
                      ? `💊 ${
                          event.item?.medicineName ||
                          'Medicine'
                        }`
                      : `🔵 ${
                          event.item?.medicineName ||
                          'Medicine'
                        } Refill Due`}
                  </h3>
                </div>

                <span className="status-badge pending">
                  {event.item?.status || 'UPCOMING'}
                </span>
              </div>

              <div className="appointment-details">
                {event.type === 'visit' && (
                  <>
                    <div>
                      <span>🕐 Time</span>
                      <strong>
                        {event.item?.appointmentTime
                          ? String(
                              event.item.appointmentTime
                            ).slice(0, 5)
                          : '—'}
                      </strong>
                    </div>

                    <div>
                      <span>👨‍⚕️ Doctor</span>
                      <strong>
                        {event.item?.doctorId === 1
                          ? 'Dr. Amit'
                          : `Doctor #${
                              event.item?.doctorId || '—'
                            }`}
                      </strong>
                    </div>
                  </>
                )}

                {event.type === 'refill' && (
                  <>
                    <div>
                      <span>🔢 Quantity</span>
                      <strong>
                        {event.item?.quantity || '—'}
                      </strong>
                    </div>

                    <div>
                      <span>📋 Prescription</span>
                      <strong>
                        {event.item?.prescriptionId || '—'}
                      </strong>
                    </div>
                  </>
                )}

                {event.type === 'next' && (
                  <>
                    <div>
                      <span>⏱ Duration</span>
                      <strong>
                        {event.item?.duration || '—'}
                      </strong>
                    </div>

                    <div>
                      <span>💊 Frequency</span>
                      <strong>
                        {event.item?.frequency || '—'}
                      </strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PatientPage({ page, patientId, goBack }) {
  const [refillPrescriptions, setRefillPrescriptions] = useState([])
  const [refillAppointments, setRefillAppointments] = useState([])
  const [selectedRefillDate, setSelectedRefillDate] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  // Appointment booking state
  const [showBooking, setShowBooking] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [doctorId, setDoctorId] = useState(1)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [slotLoading, setSlotLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  const endpoints = {
    appointments: `/appointments/patient/${patientId}`,
    queue: `/queue/patient/${patientId}/status`,
    health: `/health-records/patient/${patientId}`,
    prescriptions: `/prescriptions/patient/${patientId}`,
    followups: `/follow-ups/patient/${patientId}`,
    refills: `/medicine-refills/patient/${patientId}`
  }

  const load = async () => {
    setLoading(true)

    try {
      if (page === 'refills') {
        const [
          refillResponse,
          prescriptionResponse,
          appointmentResponse
        ] = await Promise.all([
          fetch(`${API}/medicine-refills/patient/${patientId}`),
          fetch(`${API}/prescriptions/patient/${patientId}`),
          fetch(`${API}/appointments/patient/${patientId}`)
        ])

        const refillResult = refillResponse.ok
          ? await refillResponse.json()
          : []

        const prescriptionResult = prescriptionResponse.ok
          ? await prescriptionResponse.json()
          : []

        const appointmentResult = appointmentResponse.ok
          ? await appointmentResponse.json()
          : []

        setData(
          Array.isArray(refillResult)
            ? refillResult
            : []
        )

        setRefillPrescriptions(
          Array.isArray(prescriptionResult)
            ? prescriptionResult
            : []
        )

        setRefillAppointments(
          Array.isArray(appointmentResult)
            ? appointmentResult
            : []
        )
      } else {
        const response = await fetch(
          `${API}${endpoints[page]}`
        )

        const result = await response.json()

        if (response.ok) {
          setData(
            Array.isArray(result)
              ? result
              : [result]
          )
        } else {
          setData([])
        }
      }
    } catch {
      setData([])

      if (page === 'refills') {
        setRefillPrescriptions([])
        setRefillAppointments([])
      }
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    load()
  }, [page])

  const loadSlots = async (date) => {
    setAppointmentDate(date)
    setSelectedSlot('')
    setAvailableSlots([])
    setBookingMessage('')

    if (!date) return

    setSlotLoading(true)

    try {
      const response = await fetch(
        `${API}/appointments/doctor/${doctorId}/available-slots?date=${date}`
      )

      const result = await response.json()

      if (response.ok) {
        setAvailableSlots(result)
      } else {
        setAvailableSlots([])
      }
    } catch {
      setAvailableSlots([])
    } finally {
      setSlotLoading(false)
    }
  }

  const bookAppointment = async (e) => {
    e.preventDefault()

    setBookingLoading(true)
    setBookingMessage('')
    setBookingSuccess(false)

    if (!appointmentDate || !selectedSlot) {
      setBookingMessage('Please select a date and available time slot.')
      setBookingLoading(false)
      return
    }

    try {
      const response = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          appointmentDate: appointmentDate,
          appointmentTime: selectedSlot,
          status: 'PENDING',
          reason: reason,
          notes: notes
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setBookingMessage(
          result.message || 'Unable to book appointment.'
        )
        return
      }

      setBookingSuccess(true)
      setBookingMessage(
        result.message || 'Appointment booked successfully.'
      )

      setReason('')
      setNotes('')
      setSelectedSlot('')
      setAvailableSlots([])

      await load()
    } catch {
      setBookingMessage('Cannot connect to backend.')
    } finally {
      setBookingLoading(false)
    }
  }

  const cancelBooking = () => {
    setShowBooking(false)
    setBookingMessage('')
    setBookingSuccess(false)
    setAppointmentDate('')
    setAvailableSlots([])
    setSelectedSlot('')
    setReason('')
    setNotes('')
  }

  if (page === 'queue') {
    const queue = data[0] || {}

    const hasToken =
      !loading &&
      data.length > 0 &&
      queue.tokenNumber !== undefined

    const status = String(queue.status || 'WAITING').toUpperCase()

    return (
      <div className="data-card queue-page">
        <div className="page-header-row">
          <button onClick={goBack}>← BACK</button>

          <button
            className="secondary-action"
            onClick={load}
          >
            🔄 REFRESH
          </button>
        </div>

        <div className="page-heading">
          <span className="welcome-label">PATIENT PORTAL</span>
          <h2>🎫 Queue Status</h2>
          <p>Track your token and waiting status in real time.</p>
        </div>

        {loading && (
          <div className="queue-empty">
            <div className="queue-empty-icon">🔄</div>
            <h3>Checking your queue...</h3>
            <p>Please wait while we get the latest status.</p>
          </div>
        )}

        {!loading && !hasToken && (
          <div className="queue-empty">
            <div className="queue-empty-icon">🎫</div>
            <h3>No token found for today</h3>
            <p>
              You don't currently have a queue token for today's
              hospital visit.
            </p>
            <button
              className="primary-action"
              onClick={load}
            >
              CHECK AGAIN
            </button>
          </div>
        )}

        {!loading && hasToken && (
          <>
            <div className="queue-hero">
              <div>
                <span>YOUR TOKEN</span>
                <strong>{queue.tokenNumber}</strong>
                <p>
                  {queue.notification ||
                    'Please wait for your token.'}
                </p>
              </div>

              <div className="queue-token-icon">🎫</div>
            </div>

            <div className="queue-stats">
              <div className="queue-stat">
                <span>Patients Ahead</span>
                <strong>{queue.patientsAhead ?? 0}</strong>
              </div>

              <div className="queue-stat">
                <span>Current Token</span>
                <strong>{queue.currentToken ?? 0}</strong>
              </div>

              <div className="queue-stat">
                <span>Room</span>
                <strong>{queue.room || 'Room 1'}</strong>
              </div>
            </div>

            <div className="queue-status-card">
              <div>
                <span className="queue-status-label">
                  CURRENT STATUS
                </span>
                <h3>{status}</h3>
              </div>

              <div className={`queue-status-icon ${status.toLowerCase()}`}>
                {status === 'CALLED'
                  ? '📢'
                  : status === 'SERVING'
                    ? '🩺'
                    : status === 'COMPLETED'
                      ? '✅'
                      : '⏳'}
              </div>
            </div>

            <div className="queue-notification">
              <span>🔔</span>
              <div>
                <strong>Queue Notification</strong>
                <p>
                  {queue.notification ||
                    'Please wait for your token.'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  if (page === 'appointments') {
    return (
      <div className="data-card appointment-page">
        <div className="page-header-row">
          <button onClick={goBack}>← BACK</button>

          <button
            className="primary-action"
            onClick={() => {
              setShowBooking(!showBooking)
              setBookingMessage('')
            }}
          >
            {showBooking ? 'CLOSE' : '＋ BOOK APPOINTMENT'}
          </button>
        </div>

        <div className="page-heading">
          <div>
            <span className="welcome-label">PATIENT PORTAL</span>
            <h2>📅 Appointments</h2>
            <p>Manage your doctor visits and book your next appointment.</p>
          </div>
        </div>

        {showBooking && (
          <div className="booking-card">
            <div className="booking-title">
              <div>
                <h3>➕ Book New Appointment</h3>
                <p>Select a date and an available doctor slot.</p>
              </div>
            </div>

            <form onSubmit={bookAppointment}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Doctor</label>
                  <select
                    value={doctorId}
                    onChange={(e) => {
                      setDoctorId(Number(e.target.value))
                      if (appointmentDate) {
                        loadSlots(appointmentDate)
                      }
                    }}
                  >
                    <option value={1}>Dr. Amit — Internal Medicine</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Appointment Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => loadSlots(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Available Time Slots</label>

                {!appointmentDate && (
                  <div className="slot-empty">
                    📅 Select a date to see available slots.
                  </div>
                )}

                {appointmentDate && slotLoading && (
                  <div className="slot-empty">
                    🔄 Checking available slots...
                  </div>
                )}

                {appointmentDate &&
                  !slotLoading &&
                  availableSlots.length === 0 && (
                    <div className="slot-empty">
                      😕 No available slots for this date.
                    </div>
                  )}

                {availableSlots.length > 0 && (
                  <div className="slot-grid">
                    {availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        className={
                          selectedSlot === slot
                            ? 'time-slot selected'
                            : 'time-slot'
                        }
                        onClick={() => setSelectedSlot(slot)}
                      >
                        🕐 {slot.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Reason for Visit</label>
                <input
                  type="text"
                  placeholder="Example: Diabetes follow-up"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  placeholder="Anything you want the doctor to know..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                />
              </div>

              {bookingMessage && (
                <div
                  className={
                    bookingSuccess
                      ? 'booking-message success'
                      : 'booking-message error'
                  }
                >
                  {bookingSuccess ? '✅ ' : '⚠️ '}
                  {bookingMessage}
                </div>
              )}

              <div className="booking-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={cancelBooking}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={bookingLoading || !selectedSlot}
                >
                  {bookingLoading ? 'BOOKING...' : 'CONFIRM APPOINTMENT'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="appointment-list-header">
          <div>
            <h3>📋 My Appointments</h3>
            <p>Your upcoming and previous doctor appointments.</p>
          </div>

          <button onClick={load}>🔄 REFRESH</button>
        </div>

        {loading && <p>Loading appointments...</p>}

        {!loading && data.length === 0 && (
          <div className="empty-card">
            <div className="empty-icon">📅</div>
            <h3>No appointments found</h3>
            <p>Book your first appointment using the button above.</p>
          </div>
        )}

        {!loading &&
          data.map((item, index) => (
            <div className="appointment-record" key={item.id || index}>
              <div className="appointment-record-top">
                <div>
                  <span className="appointment-label">
                    APPOINTMENT #{item.id || index + 1}
                  </span>
                  <h3>
                    {item.appointmentDate || 'Date not available'}
                  </h3>
                </div>

                <span
                  className={`status-badge ${String(
                    item.status || 'PENDING'
                  ).toLowerCase()}`}
                >
                  {item.status || 'PENDING'}
                </span>
              </div>

              <div className="appointment-details">
                <div>
                  <span>🕐 Time</span>
                  <strong>
                    {item.appointmentTime
                      ? String(item.appointmentTime).slice(0, 5)
                      : '—'}
                  </strong>
                </div>

                <div>
                  <span>👨‍⚕️ Doctor</span>
                  <strong>
                    {item.doctorId === 1
                      ? 'Dr. Amit'
                      : `Doctor #${item.doctorId || '—'}`}
                  </strong>
                </div>

                <div>
                  <span>📝 Reason</span>
                  <strong>{item.reason || 'General consultation'}</strong>
                </div>
              </div>

              {item.notes && (
                <div className="appointment-notes">
                  <strong>Notes:</strong> {item.notes}
                </div>
              )}
            </div>
          ))}
      </div>
    )
  }

  if (page === 'followups') {
    return (
      <div className="data-card">
        <div className="page-header-row">
          <button onClick={goBack}>← BACK</button>
          <button className="secondary-action" onClick={load}>🔄 REFRESH</button>
        </div>

        <div className="page-heading">
          <span className="welcome-label">PATIENT PORTAL</span>
          <h2>📆 Follow-ups</h2>
          <p>Your doctor-approved follow-up schedule.</p>
        </div>

        {loading && <p>Loading follow-ups...</p>}

        {!loading && data.length === 0 && (
          <div className="empty-card">
            <div className="empty-icon">📆</div>
            <h3>No follow-ups scheduled</h3>
            <p>Doctor-approved follow-up visits will appear here.</p>
          </div>
        )}

        {!loading && data.map((item, index) => (
          <div className="appointment-record" key={item.id || index}>
            <div className="appointment-record-top">
              <div>
                <span className="appointment-label">FOLLOW-UP #{item.id || index + 1}</span>
                <h3>{item.followUpDate || 'Date not available'}</h3>
              </div>

              <span className={`status-badge ${String(item.status || 'APPROVED').toLowerCase()}`}>
                {item.status || 'APPROVED'}
              </span>
            </div>

            <div className="appointment-details">
              <div>
                <span>🩺 Reason</span>
                <strong>{item.reason || 'Routine follow-up'}</strong>
              </div>

              <div>
                <span>👨‍⚕️ Doctor</span>
                <strong>
                  {item.doctorId === 1 ? 'Dr. Amit' : `Doctor #${item.doctorId || '—'}`}
                </strong>
              </div>

              <div>
                <span>📋 Consultation</span>
                <strong>{item.consultationId || '—'}</strong>
              </div>
            </div>

            {item.notes && (
              <div className="appointment-notes">
                <strong>Notes:</strong> {item.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (page === 'refills') {
    const parseDate = (value) => {
      if (!value) return null
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const formatDate = (value) => {
      const date = parseDate(value)

      if (!date) return 'Date unavailable'

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }

    const calculateNextRefill = (prescription) => {
      if (!prescription?.prescribedDate || !prescription?.duration) {
        return null
      }

      const match = String(prescription.duration).match(/(\d+)/)

      if (!match) return null

      const days = Number(match[1])

      if (!days || days > 3650) return null

      const startDate = parseDate(prescription.prescribedDate)

      if (!startDate) return null

      const nextDate = new Date(startDate)
      nextDate.setDate(nextDate.getDate() + days)

      return nextDate
    }

    const nextRefills = refillPrescriptions
      .map((prescription) => ({
        prescription,
        date: calculateNextRefill(prescription)
      }))
      .filter((item) => item.date !== null)

    const doctorVisits = refillAppointments
      .filter((item) => item.appointmentDate)
      .sort((a, b) =>
        String(b.appointmentDate).localeCompare(String(a.appointmentDate))
      )

    const refillHistory = [...data]
      .filter((item) => item.requestDate)
      .sort((a, b) =>
        String(b.requestDate).localeCompare(String(a.requestDate))
      )

    return (
      <div className="data-card">
        <div className="page-header-row">
          <button onClick={goBack}>← BACK</button>
          <button className="secondary-action" onClick={load}>
            🔄 REFRESH
          </button>
        </div>

        <div className="page-heading">
          <span className="welcome-label">PATIENT PORTAL</span>

          <h2>💊 Medicine Refill Calendar</h2>

          <p>
            Track your medicine history, doctor visits and upcoming refill dates.
          </p>
        </div>

        {loading && <p>Loading medication information...</p>}

        {!loading && (
          <RefillCalendar
            doctorVisits={doctorVisits}
            refillHistory={refillHistory}
            nextRefills={nextRefills}
          />
        )}


        {!loading && (
          <>
            {/* NEXT REFILL */}
            <div className="data-card" style={{ marginTop: '16px' }}>
              <h3>🔵 Upcoming Refill</h3>

              {nextRefills.length === 0 ? (
                <div className="empty-card">
                  <div className="empty-icon">📅</div>

                  <h3>No refill date available</h3>

                  <p>
                    A next refill date will appear when an approved prescription
                    contains a valid prescription date and duration.
                  </p>
                </div>
              ) : (
                nextRefills.map((item, index) => (
                  <div
                    className="appointment-record"
                    key={item.prescription.id || index}
                  >
                    <div className="appointment-record-top">
                      <div>
                        <span className="appointment-label">
                          NEXT REFILL DUE
                        </span>

                        <h3>
                          💊 {item.prescription.medicineName || 'Medicine'}
                        </h3>
                      </div>

                      <span className="status-badge pending">
                        UPCOMING
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div>
                        <span>📅 Due Date</span>
                        <strong>{formatDate(item.date)}</strong>
                      </div>

                      <div>
                        <span>⏱ Duration</span>
                        <strong>
                          {item.prescription.duration || '—'}
                        </strong>
                      </div>

                      <div>
                        <span>💊 Frequency</span>
                        <strong>
                          {item.prescription.frequency || '—'}
                        </strong>
                      </div>
                    </div>

                    <p style={{ marginTop: '12px' }}>
                      Calculated from your approved prescription.
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* DOCTOR VISITS */}
            <div className="data-card" style={{ marginTop: '16px' }}>
              <h3>🩺 Doctor Visits</h3>

              {doctorVisits.length === 0 ? (
                <p>No doctor visits found.</p>
              ) : (
                doctorVisits.map((visit, index) => (
                  <div
                    className="appointment-record"
                    key={visit.id || index}
                  >
                    <div className="appointment-record-top">
                      <div>
                        <span className="appointment-label">
                          DOCTOR VISIT
                        </span>

                        <h3>
                          🩺 {formatDate(visit.appointmentDate)}
                        </h3>
                      </div>

                      <span
                        className={`status-badge ${String(
                          visit.status || ''
                        ).toLowerCase()}`}
                      >
                        {visit.status || '—'}
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div>
                        <span>👨‍⚕️ Doctor</span>

                        <strong>
                          {visit.doctorId === 1
                            ? 'Dr. Amit'
                            : `Doctor #${visit.doctorId || '—'}`}
                        </strong>
                      </div>

                      <div>
                        <span>🕐 Time</span>

                        <strong>
                          {visit.appointmentTime
                            ? String(visit.appointmentTime).slice(0, 5)
                            : '—'}
                        </strong>
                      </div>

                      <div>
                        <span>📝 Reason</span>

                        <strong>
                          {visit.reason || 'General consultation'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* REFILL HISTORY */}
            <div className="data-card" style={{ marginTop: '16px' }}>
              <h3>💊 Previous Refill History</h3>

              {refillHistory.length === 0 ? (
                <div className="empty-card">
                  <div className="empty-icon">💊</div>

                  <h3>No previous refills</h3>

                  <p>
                    Your completed and pending refill requests will appear here.
                  </p>
                </div>
              ) : (
                refillHistory.map((item, index) => (
                  <div
                    className="appointment-record"
                    key={item.id || index}
                  >
                    <div className="appointment-record-top">
                      <div>
                        <span className="appointment-label">
                          REFILL #{item.id || index + 1}
                        </span>

                        <h3>
                          💊 {item.medicineName || 'Medicine'}
                        </h3>
                      </div>

                      <span
                        className={`status-badge ${String(
                          item.status || 'PENDING'
                        ).toLowerCase()}`}
                      >
                        {item.status || 'PENDING'}
                      </span>
                    </div>

                    <div className="appointment-details">
                      <div>
                        <span>📅 Refill Date</span>

                        <strong>
                          {formatDate(item.requestDate)}
                        </strong>
                      </div>

                      <div>
                        <span>📦 Quantity</span>

                        <strong>
                          {item.quantity || '—'}
                        </strong>
                      </div>

                      <div>
                        <span>📋 Prescription</span>

                        <strong>
                          #{item.prescriptionId || '—'}
                        </strong>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="appointment-notes">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="data-card">
      <button onClick={goBack}>← BACK</button>

      <h2>{getPatientPageTitle(page)}</h2>

      <button onClick={load}>🔄 REFRESH</button>

      {loading && <p>Loading...</p>}

      {!loading && data.length === 0 && (
        <p>No records found.</p>
      )}

      {data.map((item, index) => (
        <div className="record" key={item.id || index}>
          {Object.entries(item).map(([key, value]) => (
            <p key={key}>
              <strong>{formatKey(key)}:</strong> {String(value)}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

function getPatientPageTitle(page) {
  const titles = {
    appointments: '📅 Appointments',
    queue: '🎫 Queue Status',
    health: '❤️ Health Records',
    prescriptions: '💊 Prescriptions',
    followups: '📆 Follow-ups',
    refills: '🔄 Medicine Refill'
  }

  return titles[page] || 'Patient Dashboard'
}

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
}

export default App
