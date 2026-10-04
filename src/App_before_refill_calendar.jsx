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
          <>
            <div className="welcome-card">
              <h2>👋 Welcome, Medical Assistant</h2>

              <p>
                Record and coordinate the doctor's clinical instructions
                while the doctor focuses on patient consultations.
              </p>

              <div className="workflow-banner">
                👨‍⚕️ Doctor Consultation
                <span>→</span>
                🧑‍⚕️ Assistant Entry
                <span>→</span>
                👨‍⚕️ Doctor Approval
                <span>→</span>
                👤 Patient Care
              </div>
            </div>

            <div className="card-grid">

              <button
                className="feature-card"
                onClick={() => setPage('queue')}
              >
                <span>👥</span>
                <h3>Today's Queue</h3>
                <p>{queue.length} tokens</p>
              </button>

              <button
                className="feature-card"
                onClick={() => setPage('consultations')}
              >
                <span>📝</span>
                <h3>Clinical Instructions</h3>
                <p>{pendingConsultations.length} awaiting approval</p>
              </button>

              <button
                className="feature-card"
                onClick={() => setPage('prescriptions')}
              >
                <span>💊</span>
                <h3>Prescriptions</h3>
                <p>{pendingPrescriptions.length} awaiting approval</p>
              </button>

              <button
                className="feature-card"
                onClick={() => setPage('followups')}
              >
                <span>📅</span>
                <h3>Follow-ups</h3>
                <p>{pendingFollowUps.length} awaiting approval</p>
              </button>

              <button
                className="feature-card"
                onClick={() => setPage('refills')}
              >
                <span>🔄</span>
                <h3>Medicine Refills</h3>
                <p>{refills.length} requests</p>
              </button>

              <button
                className="feature-card"
                onClick={loadData}
              >
                <span>🔄</span>
                <h3>Refresh Data</h3>
                <p>Get latest hospital information</p>
              </button>

            </div>

            <div className="page-section">
              <h2>⚡ Assistant Responsibilities</h2>

              <div className="data-card">
                <p>✅ Manage today's patient queue</p>
                <p>✅ Record doctor's clinical instructions</p>
                <p>✅ Enter prescription information</p>
                <p>✅ Schedule follow-up requests</p>
                <p>✅ Process medicine refill requests</p>
                <p>✅ Send clinical records to doctor for approval</p>
              </div>
            </div>
          </>
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

  const cards = [
    ['📅', 'Appointments', 'appointments'],
    ['👥', "Today's Patients", 'patients'],
    ['🎫', 'Queue / Tokens', 'queue'],
    ['🩺', 'Consultation', 'consultation'],
    ['💊', 'Prescriptions', 'prescriptions'],
    ['📆', 'Follow-ups', 'followups'],
    ['❤️', 'Health Records', 'health'],
    ['🔔', 'Notifications', 'notifications']
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>🏥 Smart Patient Care</h1>
          <p>Doctor Workspace</p>
        </div>
        <button onClick={logout}>LOGOUT</button>
      </header>

      <main>
        <div className="welcome-card">
          <h2>Welcome, {user.name} 👋</h2>
          <p>Doctor • Manage patients, consultations and treatment.</p>
        </div>

        {page === 'dashboard' ? (
          <>
            <div className="section-title">
              <h2>👨‍⚕️ Doctor Dashboard</h2>
              <p>Your hospital workspace at a glance.</p>
            </div>

            <div className="dashboard-grid">
              {cards.map(([icon, title, target]) => (
                <button
                  className="dashboard-card"
                  key={target}
                  onClick={() => setPage(target)}
                >
                  <span className="card-icon">{icon}</span>
                  <span>{title}</span>
                </button>
              ))}
            </div>

            <div className="info-card">
              <h3>⚡ Quick Workflow</h3>
              <p>
                Appointment → Consultation → Prescription → Follow-up
              </p>
            </div>
          </>
        ) : (
          <DoctorPage page={page} goBack={() => setPage('dashboard')} goToPage={setPage} />
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
        setActionMessage(result.message || `Could not ${status.toLowerCase()} item.`)
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

  const renderApprovalCard = (item, type) => {
    const title =
      type === 'consultation'
        ? '🩺 Clinical Consultation'
        : type === 'prescriptions'
          ? '💊 Prescription'
          : '📆 Follow-up Request'

    return (
      <div className="info-card" key={item.id}>
        <div className="card-top-row">
          <h3>{title}</h3>
          <span className="status-badge">
            {renderValue(item.status)}
          </span>
        </div>

        <div className="data-grid">
          <p><strong>ID:</strong> {renderValue(item.id)}</p>
          <p><strong>Patient ID:</strong> {renderValue(item.patientId)}</p>
          <p><strong>Doctor ID:</strong> {renderValue(item.doctorId)}</p>

          {type === 'consultation' && (
            <>
              <p><strong>Diagnosis:</strong> {renderValue(item.diagnosis)}</p>
              <p><strong>Notes:</strong> {renderValue(item.notes)}</p>
              <p><strong>Prescription Summary:</strong> {renderValue(item.prescription)}</p>
              <p><strong>Consultation Date:</strong> {renderValue(item.consultationDate)}</p>
            </>
          )}

          {type === 'prescriptions' && (
            <>
              <p><strong>Consultation ID:</strong> {renderValue(item.consultationId)}</p>
              <p><strong>Medicine:</strong> {renderValue(item.medicineName)}</p>
              <p><strong>Dosage:</strong> {renderValue(item.dosage)}</p>
              <p><strong>Frequency:</strong> {renderValue(item.frequency)}</p>
              <p><strong>Duration:</strong> {renderValue(item.duration)}</p>
              <p><strong>Instructions:</strong> {renderValue(item.instructions)}</p>
              <p><strong>Prescribed Date:</strong> {renderValue(item.prescribedDate)}</p>
            </>
          )}

          {type === 'followups' && (
            <>
              <p><strong>Consultation ID:</strong> {renderValue(item.consultationId)}</p>
              <p><strong>Follow-up Date:</strong> {renderValue(item.followUpDate)}</p>
              <p><strong>Reason:</strong> {renderValue(item.reason)}</p>
              <p><strong>Notes:</strong> {renderValue(item.notes)}</p>
            </>
          )}
        </div>

        {item.status === 'PENDING_APPROVAL' && (
          <div className="action-row">
            <button
              className="primary-action"
              onClick={() => updateApproval(type, item.id, 'APPROVED')}
            >
              ✓ APPROVE
            </button>

            <button
              className="secondary-action"
              onClick={() => updateApproval(type, item.id, 'REJECTED')}
            >
              ✕ REJECT
            </button>
          </div>
        )}
      </div>
    )
  }

  const title = getDoctorPageTitle(page)

  return (
    <div className="data-card">
      <div className="page-header-row">
        <button onClick={goBack}>← BACK</button>

        <button className="secondary-action" onClick={load}>
          🔄 REFRESH
        </button>
      </div>

      <div className="page-heading">
        <span className="welcome-label">DOCTOR WORKSPACE</span>
        <h2>{title}</h2>

        <p>
          {page === 'consultation'
            ? 'Review clinical instructions entered by the medical assistant.'
            : page === 'prescriptions'
              ? 'Review prescription requests before sharing them with the patient.'
              : page === 'followups'
                ? 'Review follow-up requests prepared by the medical assistant.'
                : 'Manage hospital data from one place.'}
        </p>
      </div>

      {actionMessage && (
        <div className="message">{actionMessage}</div>
      )}

      {loading && (
        <div className="loading-state">
          Loading...
        </div>
      )}

      {!loading && page === 'consultation' && (
        <div>
          <div className="workflow-banner">
            <strong>Doctor Approval Required</strong>
            <p>
              The medical assistant records the doctor's clinical instructions.
              You review them here and approve or reject them before patient access.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="empty-state">
              No pending consultation approvals.
            </div>
          ) : (
            data.map(item => renderApprovalCard(item, 'consultation'))
          )}
        </div>
      )}

      {!loading && page === 'prescriptions' && (
        <div>
          <div className="workflow-banner">
            <strong>Prescription Approval</strong>
            <p>
              Review the prescription entered by the medical assistant.
              Only approved prescriptions are released to the patient.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="empty-state">
              No pending prescription approvals.
            </div>
          ) : (
            data.map(item => renderApprovalCard(item, 'prescriptions'))
          )}
        </div>
      )}

      {!loading && page === 'followups' && (
        <div>
          <div className="workflow-banner">
            <strong>Follow-up Approval</strong>
            <p>
              Review the follow-up request prepared by the medical assistant
              before it becomes visible to the patient.
            </p>
          </div>

          {data.length === 0 ? (
            <div className="empty-state">
              No pending follow-up approvals.
            </div>
          ) : (
            data.map(item => renderApprovalCard(item, 'followups'))
          )}
        </div>
      )}

      {!loading && (page === 'appointments' || page === 'patients') && (
        <div>
          <h3>📅 Appointments</h3>

          {data.length === 0 ? (
            <div className="empty-state">
              No appointments found.
            </div>
          ) : (
            data.map(item => (
              <div className="info-card" key={item.id}>
                <div className="card-top-row">
                  <h3>Appointment #{item.id}</h3>
                  <span className="status-badge">
                    {renderValue(item.status)}
                  </span>
                </div>

                <div className="data-grid">
                  <p><strong>Patient ID:</strong> {renderValue(item.patientId)}</p>
                  <p><strong>Date:</strong> {renderValue(item.appointmentDate)}</p>
                  <p><strong>Time:</strong> {renderValue(item.appointmentTime)}</p>
                  <p><strong>Reason:</strong> {renderValue(item.reason)}</p>
                  <p><strong>Notes:</strong> {renderValue(item.notes)}</p>
                </div>

                {item.status === 'PENDING' && (
                  <div className="action-row">
                    <button
                      className="primary-action"
                      onClick={() => updateAppointment(item.id, 'CONFIRMED')}
                    >
                      ✓ CONFIRM
                    </button>

                    <button
                      className="secondary-action"
                      onClick={() => updateAppointment(item.id, 'CANCELLED')}
                    >
                      ✕ CANCEL
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!loading && page === 'queue' && (
        <div>
          <h3>🎫 Today's Queue</h3>

          {data.length === 0 ? (
            <div className="empty-state">
              No queue tokens today.
            </div>
          ) : (
            data.map(item => (
              <div className="info-card" key={item.id}>
                <div className="card-top-row">
                  <h3>Token #{renderValue(item.tokenNumber)}</h3>
                  <span className="status-badge">
                    {renderValue(item.status)}
                  </span>
                </div>

                <div className="data-grid">
                  <p><strong>Patient ID:</strong> {renderValue(item.patientId)}</p>
                  <p><strong>Doctor ID:</strong> {renderValue(item.doctorId)}</p>
                  <p><strong>Room:</strong> {renderValue(item.roomNumber)}</p>
                  <p><strong>Queue Date:</strong> {renderValue(item.queueDate)}</p>
                </div>

                {item.status === 'WAITING' && (
                  <div className="action-row">
                    <button
                      className="primary-action"
                      onClick={() => updateQueue(item.id, 'CALLED')}
                    >
                      📢 CALL PATIENT
                    </button>
                  </div>
                )}

                {item.status === 'CALLED' && (
                  <div className="action-row">
                    <button
                      className="primary-action"
                      onClick={() => updateQueue(item.id, 'IN_CONSULTATION')}
                    >
                      🩺 START CONSULTATION
                    </button>
                  </div>
                )}

                {item.status === 'IN_CONSULTATION' && (
                  <div className="action-row">
                    <button
                      className="primary-action"
                      onClick={() => updateQueue(item.id, 'COMPLETED')}
                    >
                      ✓ COMPLETE
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!loading && page === 'health' && (
        <div>
          <h3>❤️ Patient Health Record</h3>

          {data.length === 0 ? (
            <div className="empty-state">
              No health record found.
            </div>
          ) : (
            data.map((item, index) => (
              <div className="info-card" key={item.id || index}>
                <div className="data-grid">
                  <p><strong>Patient ID:</strong> {renderValue(item.patientId)}</p>
                  <p><strong>Heart Rate:</strong> {renderValue(item.heartRate)}</p>
                  <p><strong>Temperature:</strong> {renderValue(item.temperature)}</p>
                  <p><strong>Oxygen:</strong> {renderValue(item.oxygenLevel)}</p>
                  <p><strong>Weight:</strong> {renderValue(item.weight)}</p>
                  <p><strong>Blood Pressure:</strong> {renderValue(item.bloodPressure)}</p>
                  <p><strong>Recorded At:</strong> {renderValue(item.recordedAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && page === 'notifications' && (
        <div>
          <h3>🔔 Notifications</h3>

          {data.length === 0 ? (
            <div className="empty-state">
              No notifications found.
            </div>
          ) : (
            data.map((item, index) => (
              <div className="info-card" key={item.id || index}>
                <h3>{renderValue(item.title || 'Notification')}</h3>
                <p>{renderValue(item.message)}</p>
                <small>{renderValue(item.createdAt)}</small>
              </div>
            ))
          )}
        </div>
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

function PatientPage({ page, patientId, goBack }) {
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
      const response = await fetch(`${API}${endpoints[page]}`)
      const result = await response.json()

      if (response.ok) {
        setData(Array.isArray(result) ? result : [result])
      } else {
        setData([])
      }
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

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
    return (
      <div className="data-card">
        <div className="page-header-row">
          <button onClick={goBack}>← BACK</button>
          <button className="secondary-action" onClick={load}>🔄 REFRESH</button>
        </div>

        <div className="page-heading">
          <span className="welcome-label">PATIENT PORTAL</span>
          <h2>💊 Medicine Refills</h2>
          <p>Request and track medicine refill requests.</p>
        </div>

        {loading && <p>Loading refill requests...</p>}

        {!loading && data.length === 0 && (
          <div className="empty-card">
            <div className="empty-icon">💊</div>
            <h3>No refill requests yet</h3>
            <p>Your medicine refill requests will appear here.</p>
          </div>
        )}

        {!loading && data.map((item, index) => (
          <div className="appointment-record" key={item.id || index}>
            <div className="appointment-record-top">
              <div>
                <span className="appointment-label">
                  REFILL REQUEST #{item.id || index + 1}
                </span>

                <h3>💊 {item.medicineName || 'Medicine'}</h3>
              </div>

              <span className={`status-badge ${String(item.status || 'PENDING').toLowerCase()}`}>
                {item.status || 'PENDING'}
              </span>
            </div>

            <div className="appointment-details">
              <div>
                <span>📦 Quantity</span>
                <strong>{item.quantity || '—'}</strong>
              </div>

              <div>
                <span>📋 Prescription</span>
                <strong>#{item.prescriptionId || '—'}</strong>
              </div>

              <div>
                <span>📅 Request Date</span>
                <strong>{item.requestDate || '—'}</strong>
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
