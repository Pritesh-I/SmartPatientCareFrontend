import { useState } from 'react'
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
  ) : (
    <PatientApp user={user} logout={logout} />
  )
}

/* =========================
   DOCTOR APP
========================= */

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
                Appointments → Patient → Consultation → Prescription → Follow-up
              </p>
            </div>
          </>
        ) : (
          <DoctorPage page={page} goBack={() => setPage('dashboard')} />
        )}
      </main>
    </div>
  )
}

function DoctorPage({ page, goBack }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const endpoint = {
    appointments: `/appointments/doctor/${DOCTOR_ID}`,
    patients: `/appointments/doctor/${DOCTOR_ID}`,
    queue: '/queue/today',
    consultation: `/consultations/doctor/${DOCTOR_ID}`,
    prescriptions: `/prescriptions/doctor/${DOCTOR_ID}`,
    followups: `/follow-ups/doctor/${DOCTOR_ID}`,
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

  const title = getDoctorPageTitle(page)

  return (
    <div className="data-card">
      <div className="page-header-row">
        <button onClick={goBack}>← BACK</button>
        <button className="secondary-action" onClick={load}>🔄 REFRESH</button>
      </div>

      <div className="page-heading">
        <span className="welcome-label">DOCTOR WORKSPACE</span>
        <h2>{title}</h2>
        <p>Manage hospital data from one place.</p>
      </div>

      {actionMessage && (
        <div className="message">{actionMessage}</div>
      )}

      {loading && <p>Loading...</p>}

      {!loading && data.length === 0 && (
        <div className="queue-empty">
          <div className="queue-empty-icon">📋</div>
          <h3>No records found</h3>
          <p>There are no records available in this section.</p>
          <button className="primary-action" onClick={load}>
            LOAD DATA
          </button>
        </div>
      )}

      {!loading && data.map((item, index) => (
        <div className="record" key={item.id || index}>
          {Object.entries(item).map(([key, value]) => (
            <p key={key}>
              <strong>{formatKey(key)}:</strong> {String(value)}
            </p>
          ))}

          {page === 'appointments' && item.status !== 'CANCELLED' && (
            <div className="record-actions">
              <button onClick={() => updateAppointment(item.id, 'CONFIRMED')}>
                CONFIRM
              </button>
              <button onClick={() => updateAppointment(item.id, 'CANCELLED')}>
                CANCEL
              </button>
            </div>
          )}

          {page === 'queue' && (
            <div className="record-actions">
              <button onClick={() => updateQueue(item.id, 'CALLED')}>
                CALL PATIENT
              </button>
              <button onClick={() => updateQueue(item.id, 'SERVING')}>
                SERVE
              </button>
              <button onClick={() => updateQueue(item.id, 'COMPLETED')}>
                COMPLETE
              </button>
            </div>
          )}
        </div>
      ))}
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

/* =========================
   PATIENT APP
========================= */

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
              <strong>{formatKey(key)}:</strong> {String(value)}
            </p>
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
