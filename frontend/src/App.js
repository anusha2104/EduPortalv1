import React, { useState, useEffect, useRef } from 'react';

// When using the CDN method from index.html, Firebase is available on the global 'window' object
const auth = window.firebase.auth();

// Utility function to combine class names
const cn = (...classNames) => classNames.filter(Boolean).join(' ');

const App = () => {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [theme, setTheme] = useState('default');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [noteDetails, setNoteDetails] = useState({ subject: '', chapter: '', content: '' });
  const [noteSavedMessage, setNoteSavedMessage] = useState(false);

  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
          }),
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user profile');
            return res.json();
          })
          .then(data => {
            setUser(data);
            setIsLoggedIn(true);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error fetching user profile:", error);
            setIsLoading(false);
          });
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateUserData = async (updatedFields) => {
    if (!user) return;
    try {
        const response = await fetch(`/api/user/${user.firebaseUid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields),
        });
        if (!response.ok) throw new Error('Failed to update user data');
        const updatedUser = await response.json();
        setUser(updatedUser);
    } catch (error) {
        console.error("Error updating user data:", error);
    }
  };
  
  const addPoints = (amount, reason) => {
    if (user) {
        const newPoints = (user.points || 0) + amount;
        updateUserData({ points: newPoints });
        console.log(`+${amount} points for: ${reason}`);
    }
  };

  const themeClasses = {
    default: {
      bg: 'bg-gray-100', sidebarBg: 'bg-gray-800', sidebarText: 'text-white', sidebarItemBg: 'bg-gray-700', sidebarItemHover: 'hover:bg-gray-700', activeItemBg: 'bg-gray-700', activeItemText: 'text-emerald-400', cardBg: 'bg-white', cardShadow: 'shadow-lg', cardText: 'text-gray-900', cardTitle: 'text-gray-500', cardDescription: 'text-gray-600', buttonBg: 'bg-emerald-500', buttonHover: 'hover:bg-emerald-600',
    },
    game: {
      bg: 'bg-gray-900', sidebarBg: 'bg-gray-950', sidebarText: 'text-yellow-400', sidebarItemBg: 'bg-gray-800', sidebarItemHover: 'hover:bg-gray-800', activeItemBg: 'bg-gray-800', activeItemText: 'text-red-400', cardBg: 'bg-gray-800', cardShadow: 'shadow-2xl', cardText: 'text-gray-100', cardTitle: 'text-gray-300', cardDescription: 'text-gray-400', buttonBg: 'bg-red-500', buttonHover: 'hover:bg-red-600',
    },
  };
  const currentTheme = themeClasses[theme];

  const sendVerificationEmail = async (recipientEmail) => {
    try {
      await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail }),
      });
    } catch (error) {
      console.error('Error sending email request:', error);
    }
  };

  // --- ALL SUB-COMPONENTS ARE NOW DEFINED INSIDE THE MAIN APP COMPONENT ---
  // This ensures they have access to state and props correctly.

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
      e.preventDefault();
      setError('');
      setMessage('');
      if (isSignUp) {
        try {
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          await sendVerificationEmail(userCredential.user.email);
          setMessage('Account created! Please sign in.');
          setIsSignUp(false);
        } catch (err) {
          setError(err.message);
        }
      } else {
        try {
          await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
          setError(err.message);
        }
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 font-sans">
        <div className="flex flex-col md:flex-row bg-white p-8 w-full max-w-4xl rounded-3xl shadow-2xl gap-8">
          <div className="flex-1 p-6 text-gray-800">
            <h2 className="text-3xl font-bold mb-4">Welcome to EduPortal!</h2>
            <p className="text-lg mb-4">Your personalized study companion designed to make learning fun and rewarding.</p>
          </div>
          
          <form onSubmit={handleAuth} className="flex-1 p-6 border-l border-gray-200 flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{isSignUp ? 'Create an Account' : 'Sign In'}</h3>
            {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-lg">{error}</p>}
            {message && <p className="text-green-500 text-sm bg-green-100 p-3 rounded-lg">{message}</p>}
            <div className="flex flex-col">
              <label className="text-gray-900 font-semibold">Email</label>
              <input className="mt-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-900 font-semibold">Password</label>
              <input className="mt-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="bg-gray-900 text-white font-semibold py-3 rounded-xl w-full cursor-pointer mt-4 hover:bg-gray-800">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
            <p className="text-center text-gray-700 text-sm mt-2">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <span className="text-blue-500 font-medium cursor-pointer ml-1" onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </span>
            </p>
          </form>
        </div>
      </div>
    );
  };

  const NavItem = ({ icon, name }) => (
    <li className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${currentPage === name ? `${currentTheme.activeItemBg} ${currentTheme.activeItemText} font-semibold` : `${currentTheme.sidebarItemHover} text-gray-200`}`} onClick={() => setCurrentPage(name)}>
      {icon}
      <span>{name}</span>
    </li>
  );

  const Sidebar = () => {
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };
    
    return (
        <div className={`w-1/4 ${currentTheme.sidebarBg} ${currentTheme.sidebarText} p-6 flex flex-col h-screen rounded-r-3xl ${currentTheme.cardShadow}`}>
            <div className="flex items-center space-x-2 mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${theme === 'game' ? 'text-red-400' : 'text-emerald-400'}`}><path d="M22 10v6m-4-6V6l-8-4-8 4v12l8 4 8-4v-6"/><path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M12 2v20"/><path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>
                <span className="text-2xl font-bold font-inter tracking-wider">EduPortal</span>
            </div>
            <nav className="flex-grow">
                <ul className="space-y-4">
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>} name="Dashboard"/>
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>} name="Notes"/>
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} name="Community"/>
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>} name="Video Call"/>
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gamepad"><path d="M6 12H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M12 6v4"/><path d="M15 9h-6"/><path d="M12 12v6"/><path d="M9 15h6"/><path d="M6 18H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2"/></svg>} name="Games"/>
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy"><path d="M14.5 16h-5a2.5 2.5 0 1 1 0-5h5a2.5 2.5 0 1 1 0 5z"/><path d="M20 9.4V10a6 6 0 0 0-12 0v-.6l-2 1V22h16V10.4l-2-1z"/><path d="M8 22v-4"/><path d="M16 22v-4"/><path d="M8 11.4v2.5"/><path d="M16 11.4v2.5"/><path d="M12 12v3"/></svg>} name="Achievements"/>
                    <NavItem icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} name="Profile"/>
                </ul>
            </nav>
            <div className={`p-4 rounded-xl flex items-center space-x-3 mt-auto ${theme === 'game' ? 'bg-red-800' : 'bg-gray-700'} shadow-inner`}>
                <img src={`https://placehold.co/40x40/4ade80/ffffff?text=${user?.name?.charAt(0) ?? 'S'}`} alt="Profile" className="rounded-full border-2 border-emerald-400"/>
                <div className="flex flex-col">
                    <span className="font-semibold text-lg">{user?.name ?? 'Student'}</span>
                    <span className="text-sm text-gray-300">{user?.points ?? 0} Points</span>
                </div>
            </div>
            <button onClick={() => setIsChatbotOpen(true)} className={`mt-4 w-full p-4 rounded-xl shadow-inner flex items-center justify-center space-x-2 font-semibold transition-colors ${theme === 'game' ? 'bg-red-800 text-yellow-400 hover:bg-red-700' : 'bg-gray-700 text-emerald-400 hover:bg-gray-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                <span>Chat with Tutor</span>
            </button>
            <button onClick={handleLogout} className="mt-4 w-full p-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                Log Out
            </button>
        </div>
    );
  }

  const Card = ({ title, value, description }) => (
    <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow} flex flex-col items-start space-y-2`}>
      <h3 className={`${currentTheme.cardTitle} font-medium`}>{title}</h3>
      <p className={`text-3xl font-bold ${theme === 'game' ? 'text-red-400' : 'text-emerald-500'}`}>{value}</p>
      <p className={`text-sm ${currentTheme.cardDescription}`}>{description}</p>
    </div>
  );

  const Avatar = ({ src, name }) => {
    const getInitials = (fullName) => {
      if (!fullName) return '';
      const parts = fullName.split(' ');
      let initials = parts[0].charAt(0);
      if (parts.length > 1) {
        initials += parts[1].charAt(0);
      }
      return initials.toUpperCase();
    };

    return (
      <div className="flex flex-col items-center gap-2">
        {src ? (<img src={src} className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-md" alt={name ? name : 'Avatar'}/>) : 
        (<div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-100 flex items-center justify-center text-emerald-800 font-semibold shadow-md">{getInitials(name)}</div>)}
        {name && <span className="text-gray-900 font-medium text-sm">{name}</span>}
      </div>
    );
  };
  
  // ...existing code...
  const InteractiveGridPattern = ({
    width = 40, height = 40, squares = [24, 24], className, squaresClassName, ...props
  }) => {
    const [horizontal, vertical] = squares;
    // SVG is decorative only — ignore pointer events so it doesn't block page interaction.
    return (
      <svg
        width={width * horizontal}
        height={height * vertical}
        className={cn("absolute inset-0 h-full w-full pointer-events-none", "border border-gray-400/30", className)}
        {...props}
      >
        {Array.from({ length: horizontal * vertical }).map((_, index) => {
          const x = (index % horizontal) * width;
          const y = Math.floor(index / horizontal) * height;
          // rects remain decorative — no mouse handlers so they won't intercept clicks
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              className={cn("stroke-gray-400/30 transition-all duration-100 ease-in-out fill-transparent", squaresClassName)}
            />
          );
        })}
      </svg>
    );
  };
// ...existing code...

  const DashboardPage = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Study Streak" value={`${user?.streak ?? 0} Days`} description="Keep up the great work!" currentTheme={currentTheme} theme={theme} />
        <Card title="Total Points" value={user?.points ?? 0} description="Earn more points to unlock rewards." currentTheme={currentTheme} theme={theme} />
        <Card title="Homework Due" value={user?.homework?.length ?? 0} description="Don't forget to submit!" currentTheme={currentTheme} theme={theme} />
        <Card title="Tests" value={user?.testScores?.length ?? 0} description="Check your latest scores." currentTheme={currentTheme} theme={theme} />
      </div>
      <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
        <h2 className={`text-xl font-bold mb-4 ${currentTheme.cardText}`}>Upcoming Classes</h2>
        <ul className="space-y-4">
          {user?.upcomingClasses?.map(c => (
            <li key={c.id} className="p-4 bg-gray-700 rounded-2xl flex justify-between items-center">
              <div>
                <span className="font-semibold text-gray-200">{c.title}</span>
                <p className="text-sm text-gray-400">{c.time}</p>
              </div>
              <button className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors`} onClick={() => addPoints(20, 'Attending Class')}>Join</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
          <h2 className={`text-xl font-bold mb-4 ${currentTheme.cardText}`}>Homework</h2>
          <ul className="space-y-4">
            {user?.homework?.map(h => (
              <li key={h.id} className="p-4 bg-gray-700 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="font-semibold text-gray-200">{h.title}</span>
                  <p className="text-sm text-gray-400">Due: {h.due}</p>
                </div>
                <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-300 transition-colors">View</button>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
          <h2 className={`text-xl font-bold mb-4 ${currentTheme.cardText}`}>Recorded Lectures</h2>
          <div className="p-4 bg-gray-700 rounded-2xl flex justify-between items-center text-gray-400 italic"><p>Placeholder for recorded lectures.</p></div>
        </div>
      </div>
    </div>
  );
  
const NotesPage = () => {
  const [isNotesLoading, setIsNotesLoading] = useState(true);

  useEffect(() => {
    // Disabled: no fetching, just stop loading so UI shows
    setIsNotesLoading(false);
  }, [user]);

  const handleNoteChange = (e) => {
    // Disabled: do nothing (keeps UI only)
    void e;
    return;
  };

  const handleSaveNote = async () => {
    // Disabled: do nothing
    return;
  };


    return (
      <div className="space-y-8">
        <div className={`${currentTheme.cardBg} p-6 rounded-3xl shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${currentTheme.cardText}`}>Create a New Note</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" name="subject" placeholder="Subject" value={noteDetails.subject} onChange={handleNoteChange} className="p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-gray-700 text-gray-200 border-none"/>
            <input type="text" name="chapter" placeholder="Chapter Title" value={noteDetails.chapter} onChange={handleNoteChange} className="p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-gray-700 text-gray-200 border-none"/>
          </div>
          <textarea name="content" placeholder="Start writing your notes here..." value={noteDetails.content} onChange={handleNoteChange} className="w-full p-4 border rounded-xl h-64 resize-none focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow bg-gray-700 text-gray-200 border-none"></textarea>
          <button onClick={handleSaveNote} className={`mt-4 w-full ${currentTheme.buttonBg} ${currentTheme.buttonHover} text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg`}>Save Note</button>
          {noteSavedMessage && (<div className="mt-4 p-3 rounded-xl bg-emerald-100 text-emerald-700 text-center font-semibold">Note saved successfully!</div>)}
        </div>
        <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
          <h2 className={`text-xl font-bold mb-4 ${currentTheme.cardText}`}>Your Saved Notes</h2>
          {isNotesLoading ? (<p className="text-gray-500 italic">Loading notes...</p>) :
          notes.length === 0 ? (<p className="text-gray-500 italic">You haven't saved any notes yet.</p>) : 
          (<ul className="space-y-4">{notes.map(note => (<li key={note._id} className="p-4 bg-gray-700 rounded-2xl cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => setViewingNote(note)}><h3 className="font-semibold text-lg text-gray-200">{note.chapter}</h3><p className="text-sm text-gray-400 mb-2">{note.subject}</p><p className="text-sm text-gray-300 line-clamp-3">{note.content}</p></li>))}</ul>)}
        </div>
      </div>
    );
  };
  
  const CommunityPage = () => (
    <div className="space-y-8">
      <div className={`${currentTheme.cardBg} p-8 rounded-3xl ${currentTheme.cardShadow} text-center`}>
        <h2 className={`text-2xl font-bold mb-4 ${currentTheme.cardText}`}>Community Q&A</h2>
        <p className="text-gray-400 mb-4">This is where students can anonymously post questions and help others with answers.</p>
        <div className="bg-gray-700 p-6 rounded-2xl border-dashed border-2 border-gray-600">
          <p className="text-sm text-gray-500 mb-4">This feature would require a backend database to store and manage anonymous posts and answers.</p>
          <div className="flex justify-center items-center space-x-4">
            <button className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg`}>Ask a Question</button>
            <button className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg`} onClick={() => addPoints(30, 'Solving a doubt')}>Help Answer a Question</button>
          </div>
        </div>
      </div>
    </div>
  );
  const VideoCallPage = () => (
    <div className={`${currentTheme.cardBg} p-8 rounded-3xl ${currentTheme.cardShadow} text-center`}>
      <h2 className={`text-2xl font-bold mb-4 ${currentTheme.cardText}`}>Study Conference</h2>
      <p className="text-gray-400 mb-4">This is a proctored video conference where you only see avatars.</p>
      <div className="flex justify-center items-end space-x-6 mb-6">
        <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" name="Junior" />
        <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" name="Jane" />
        <Avatar src="https://i.pravatar.cc/150?u=a04258114e29026702d" name="Joe" />
        <Avatar name="Alex" />
      </div>
      <p className="text-sm font-semibold text-red-500">Note: The video call, avatar system, and ML proctoring model are advanced features that would require significant backend and specialized development to implement.</p>
      <button className={`mt-6 ${currentTheme.buttonBg} ${currentTheme.buttonHover} text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg`} onClick={() => addPoints(30, 'Studying in video conference')}>Simulate 1 Hour of Study (+30 pts)</button>
    </div>
  );
  const GamesPage = () => (
    <div className={`${currentTheme.cardBg} p-8 rounded-3xl ${currentTheme.cardShadow} text-center`}>
      <h2 className={`text-2xl font-bold mb-4 ${currentTheme.cardText}`}>Study-Based Games</h2>
      <p className="text-gray-400 mb-4">This section would contain engaging games designed to help students learn and practice.</p>
      <div className="bg-gray-700 p-6 rounded-2xl border-dashed border-2 border-gray-600"><p className="text-sm text-gray-500 italic">Example: A vocabulary game where you have to guess the correct definition before the timer runs out.</p></div>
    </div>
  );
  const AchievementsPage = () => {
    const achievements = [
        { title: 'First Steps', description: 'Log in for the first time.', pointsRequired: 0, icon: '🚶' },
        { title: 'Note Taker', description: 'Create 5 notes.', pointsRequired: 5, icon: '📝' },
        { title: 'Chatterbox', description: 'Ask the AI tutor 10 questions.', pointsRequired: 0, icon: '💬' },
        { title: 'Community Helper', description: 'Answer 5 community questions.', pointsRequired: 150, icon: '🤝' },
        { title: 'Perfect Week', description: 'Maintain a 7-day study streak.', pointsRequired: 100, icon: '🗓️' },
        { title: 'The Expert', description: 'Earn 1000 points.', pointsRequired: 1000, icon: '🧠' },
    ];
    return (
        <div className="space-y-8">
            <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
                <h2 className={`text-2xl font-bold mb-4 ${currentTheme.cardText}`}>Your Achievements</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement, index) => (
                    <div key={index} className={`p-4 rounded-xl flex items-center space-x-4 transition-all duration-300 ${ (user?.points ?? 0) >= achievement.pointsRequired ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                    <span className="text-4xl">{achievement.icon}</span>
                    <div className="flex flex-col">
                        <h3 className="font-semibold text-lg">{achievement.title}</h3>
                        <p className="text-sm">{achievement.description}</p>
                        <p className={`text-xs font-medium mt-1 ${ (user?.points ?? 0) >= achievement.pointsRequired ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {(user?.points ?? 0) >= achievement.pointsRequired ? 'UNLOCKED' : `LOCKED - Needs ${achievement.pointsRequired} points`}
                        </p>
                    </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
  };
  const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(user?.name ?? '');
    const [editedBio, setEditedBio] = useState(user?.bio ?? '');

    useEffect(() => {
        setEditedName(user?.name ?? '');
        setEditedBio(user?.bio ?? '');
    }, [user]);

    const handleSave = () => {
      updateUserData({ name: editedName, bio: editedBio });
      setIsEditing(false);
    };
    const handleCancel = () => {
      setEditedName(user.name);
      setEditedBio(user.bio);
      setIsEditing(false);
    };

    return (
      <div className="space-y-8">
        <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4 mb-4">
              <img src={`https://placehold.co/80x80/4ade80/ffffff?text=${user?.name?.charAt(0) ?? 'S'}`} alt="User Avatar" className="rounded-full border-4 border-emerald-400"/>
              <div>
                {isEditing ? (<input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className={`text-2xl font-bold p-2 rounded-lg bg-gray-700 ${currentTheme.cardText} focus:outline-none focus:ring-2 focus:ring-emerald-500`}/>) : (<h2 className={`text-2xl font-bold ${currentTheme.cardText}`}>{user?.name}</h2>)}
                <p className="text-gray-400">Student</p>
              </div>
            </div>
            {!isEditing ? (<button onClick={() => setIsEditing(true)} className={`${currentTheme.buttonBg} ${currentTheme.buttonHover} text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors`}>Edit Profile</button>) : 
            (<div className="flex space-x-2"><button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">Save</button><button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">Cancel</button></div>)}
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.cardText}`}>Test Scores</h3>
              <ul className="space-y-2">{user?.testScores?.map((score, index) => (<li key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-xl"><span className="font-medium text-gray-200">{score.subject}</span><span className="font-semibold text-gray-400">{score.score}</span></li>))}</ul>
            </div>
            <div>
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.cardText}`}>Bio</h3>
              {isEditing ? (<textarea value={editedBio} onChange={(e) => setEditedBio(e.target.value)} className={`w-full h-24 p-2 rounded-lg bg-gray-700 ${currentTheme.cardText} focus:outline-none focus:ring-2 focus:ring-emerald-500`}/>) : (<div className="p-4 bg-gray-700 rounded-2xl h-24 text-gray-300"><p>{user?.bio}</p></div>)}
            </div>
          </div>
        </div>
        <div className={`${currentTheme.cardBg} p-6 rounded-3xl ${currentTheme.cardShadow}`}>
          <h2 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${currentTheme.cardText}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 lucide lucide-gift"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><path d="M2 7h20"/><path d="M12 22l-1-1-1 1-1-1-1 1-1-1-1 1-1-1-1 1"/><rect width="18" height="6" x="3" y="2" rx="2" ry="2"/><path d="M12 22L12 2"/></svg><span>Rewards</span></h2>
          <p className="text-gray-400 mb-4">Earn 10,000 points to redeem a gift card for services like Audible or Spotify.</p>
          <p className={`text-xl font-bold ${currentTheme.cardText}`}>Current progress: <span className="text-emerald-500">{user?.points ?? 0} / 10,000</span></p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className={`${theme === 'game' ? 'bg-red-500' : 'bg-emerald-500'} h-2.5 rounded-full transition-all duration-500 ease-in-out`} style={{ width: `${Math.min(100, ((user?.points ?? 0) / 10000) * 100)}%` }}></div></div>
          <button className={`mt-6 w-full bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-yellow-600 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed`} disabled={(user?.points ?? 0) < 10000}>Redeem Gift Card</button>
        </div>
      </div>
    );
  };
  const NoteViewModal = ({ note, onClose }) => {
    if (!note) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col font-sans">
                <div className="bg-gray-900 text-white p-4 rounded-t-3xl flex justify-between items-center">
                    <h3 className="text-xl font-bold text-emerald-400">{note.chapter}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                </div>
                <div className="p-6 border-b border-gray-700">
                    <p className="text-sm text-gray-400"><strong>Subject:</strong> {note.subject}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <p className="text-gray-200 whitespace-pre-wrap">{note.content}</p>
                </div>
            </div>
        </div>
    );
  };
  const ChatbotModal = ({ onClose, addPoints }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [chatHistory]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return;
        const newUserMessage = { role: 'user', parts: [{ text: userMessage.trim() }] };
        const newChatHistory = [...chatHistory, newUserMessage];
        setChatHistory(newChatHistory);
        setUserMessage('');
        setIsChatLoading(true);
        // Placeholder for chatbot response
        setTimeout(() => {
            setChatHistory(prev => [...prev, {role: 'model', parts: [{text: "I am a placeholder AI. How can I help you study today?"}]}]);
            addPoints(1, 'Asking a question to the tutor');
            setIsChatLoading(false);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end items-end p-4">
            <div className="bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md h-3/4 flex flex-col font-sans">
            <div className="bg-gray-900 text-white p-4 rounded-t-3xl flex justify-between items-center"><h3 className="text-xl font-bold flex items-center space-x-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 lucide lucide-bot"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg><span>AI Tutor</span></h3><button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">{chatHistory.map((msg, index) => (<div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl max-w-xs ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>{msg.parts[0].text}</div></div>))}
                {isChatLoading && (<div className="flex justify-start"><div className="p-3 bg-gray-700 text-gray-100 rounded-2xl rounded-bl-none max-w-xs"><div className="typing-indicator flex space-x-1"><span className="dot animate-bounce" style={{ animationDelay: '0s' }}>.</span><span className="dot animate-bounce" style={{ animationDelay: '0.2s' }}>.</span><span className="dot animate-bounce" style={{ animationDelay: '0.4s' }}>.</span></div></div></div>)}<div ref={messagesEndRef} /></div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex space-x-2">
                <input type="text" value={userMessage} onChange={(e) => setUserMessage(e.target.value)} placeholder="Ask a question..." className="flex-1 p-3 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                <button type="submit" disabled={isChatLoading || !userMessage.trim()} className={`p-3 rounded-full transition-colors ${isChatLoading || !userMessage.trim() ? 'bg-gray-600 text-gray-400' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 19-3-9-9-3 19-7Z"/><path d="M22 2 11 13"/></svg></button>
            </form>
            </div>
        </div>
    );
  };

  const LoadingPage = () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <svg xmlns="http://www.w3.org/2000/svg" height="200px" width="200px" viewBox="0 0 200 200" className="pencil">
          <defs>
            <clipPath id="pencil-eraser">
              <rect height="30" width="30" ry="5" rx="5"></rect>
            </clipPath>
          </defs>
          <circle transform="rotate(-113,100,100)" strokeLinecap="round" strokeDashoffset="439.82" strokeDasharray="439.82 439.82" strokeWidth="2" stroke="currentColor" fill="none" r="70" className="pencil__stroke"></circle>
          <g transform="translate(100,100)" className="pencil__rotate">
            <g fill="none">
              <circle transform="rotate(-90)" strokeDashoffset="402" strokeDasharray="402.12 402.12" strokeWidth="30" stroke="hsl(223,90%,50%)" r="64" className="pencil__body1"></circle>
              <circle transform="rotate(-90)" strokeDashoffset="465" strokeDasharray="464.96 464.96" strokeWidth="10" stroke="hsl(223,90%,60%)" r="74" className="pencil__body2"></circle>
              <circle transform="rotate(-90)" strokeDashoffset="339" strokeDasharray="339.29 339.29" strokeWidth="10" stroke="hsl(223,90%,40%)" r="54" className="pencil__body3"></circle>
            </g>
            <g transform="rotate(-90) translate(49,0)" className="pencil__eraser">
              <g className="pencil__eraser-skew">
                <rect height="30" width="30" ry="5" rx="5" fill="hsl(223,90%,70%)"></rect>
                <rect clipPath="url(#pencil-eraser)" height="30" width="5" fill="hsl(223,90%,60%)"></rect>
                <rect height="20" width="30" fill="hsl(223,10%,90%)"></rect>
                <rect height="20" width="15" fill="hsl(223,10%,70%)"></rect>
                <rect height="20" width="5" fill="hsl(223,10%,80%)"></rect>
                <rect height="2" width="30" y="6" fill="hsla(223,10%,10%,0.2)"></rect>
                <rect height="2" width="30" y="13" fill="hsla(223,10%,10%,0.2)"></rect>
              </g>
            </g>
            <g transform="rotate(-90) translate(49,-30)" className="pencil__point">
              <polygon points="15 0,30 30,0 30" fill="hsl(33,90%,70%)"></polygon>
              <polygon points="15 0,6 30,0 30" fill="hsl(33,90%,50%)"></polygon>
              <polygon points="15 0,20 10,10 10" fill="hsl(223,10%,10%)"></polygon>
            </g>
          </g>
        </svg>
      </div>
  );

  const MainApp = () => {
    const renderPageContent = () => {
        switch (currentPage) {
          case 'Dashboard': return <DashboardPage />;
          case 'Notes': return <NotesPage />;
          case 'Community': return <CommunityPage />;
          case 'Video Call': return <VideoCallPage />;
          case 'Games': return <GamesPage />;
          case 'Achievements': return <AchievementsPage />;
          case 'Profile': return <ProfilePage />;
          default: return <DashboardPage />;
        }
    };

    return (
        <div className={cn("flex h-screen font-sans relative", currentTheme.bg)}>
            {theme === 'game' && (
                <InteractiveGridPattern width={20} height={20} squares={[80, 80]} className="z-0 [mask-image:radial-gradient(400px_circle_at_center,white,transparent)]" squaresClassName="hover:fill-red-500"/>
            )}
            <div className="relative z-10 flex w-full">
                <Sidebar />
                <div className="w-3/4 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className={`${currentTheme.cardText} text-4xl font-extrabold font-inter`}>{currentPage === 'Dashboard' ? `Welcome back, ${user?.name ?? 'Student'}!` : currentPage}</h1>
                        <label id="theme-toggle-button" className="text-gray-900 text-base relative inline-block w-28 cursor-pointer">
                            <input type="checkbox" id="toggle" className="opacity-0 w-0 h-0" checked={theme === 'game'} onChange={() => setTheme(theme === 'default' ? 'game' : 'default')}/>
                            <svg viewBox="0 0 69.667 44" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-250 ease-in-out"><defs><filter id="container-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2"/></filter><filter id="sun-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f8e664" floodOpacity="0.8"/></filter></defs><g transform="translate(3.5 3.5)" data-name="Component 15 – 1" id="Component_15_1"><g filter="url(#container-shadow)" transform="translate(-3.5 -3.5)"><rect fill={theme === 'default' ? '#83cbd8' : '#2b4360'} transform="translate(3.5 3.5)" rx="17.5" height="35" width="60.667" data-name="container" id="container" className="transition-all duration-250 ease-in-out"></rect></g><g id="button" transform={theme === 'default' ? 'translate(2.333 2.333)' : 'translate(32.333 2.333)'}><g data-name="sun" id="sun" className={theme === 'default' ? 'opacity-100' : 'opacity-0'}><g filter="url(#sun-shadow)" transform="translate(-5.83 -5.83)"><circle fill="#f8e664" transform="translate(5.83 5.83)" r="15.167" cy="15.167" cx="15.167" data-name="sun-outer" id="sun-outer-2"></circle></g><g filter="url(#sun-shadow)" transform="translate(-5.83 -5.83)"><path fill="rgba(246,254,247,0.29)" transform="translate(9.33 9.33)" d="M11.667,0A11.667,11.667,0,1,1,0,11.667,11.667,11.667,0,0,1,11.667,0Z" data-name="sun" id="sun-3"></path></g><circle fill="#fcf4b9" transform="translate(8.167 8.167)" r="7" cy="7" cx="7" id="sun-inner"></circle></g><g data-name="moon" id="moon" className={theme === 'default' ? 'opacity-0' : 'opacity-100'}><g filter="url(#moon)" transform="translate(-31.5 -5.83)"><circle fill="#cce6ee" transform="translate(31.5 5.83)" r="15.167" cy="15.167" cx="15.167" data-name="moon" id="moon-3"></circle></g><g fill="#a6cad0" transform="translate(-24.415 -1.009)" id="patches"><circle transform="translate(43.009 4.496)" r="2" cy="2" cx="2"></circle><circle transform="translate(39.366 17.952)" r="2" cy="2" cx="2" data-name="patch"></circle><circle transform="translate(33.016 8.044)" r="1" cy="1" cx="1" data-name="patch"></circle><circle transform="translate(51.081 18.888)" r="1" cy="1" cx="1" data-name="patch"></circle><circle transform="translate(33.016 22.503)" r="1" cy="1" cx="1" data-name="patch"></circle><circle transform="translate(50.081 10.53)" r="1.5" cy="1.5" cx="1.5" data-name="patch"></circle></g></g></g><g filter="url(#cloud)" transform="translate(-3.5 -3.5)" className={theme === 'default' ? 'opacity-100' : 'opacity-0'}><path fill="#fff" transform="translate(-3466.47 -160.94)" d="M3512.81,173.815a4.463,4.463,0,0,1,2.243.62.95.95,0,0,1,.72-1.281,4.852,4.852,0,0,1,2.623.519c.034.02-.5-1.968.281-2.716a2.117,2.117,0,0,1,2.829-.274,1.821,1.821,0,0,1,.854,1.858c.063.037,2.594-.049,3.285,1.273s-.865,2.544-.807,2.626a12.192,12.192,0,0,1,2.278.892c.553.448,1.106,1.992-1.62,2.927a7.742,7.742,0,0,1-3.762-.3c-1.28-.49-1.181-2.65-1.137-2.624s-1.417,2.2-2.623,2.2a4.172,4.172,0,0,1-2.394-1.206,3.825,3.825,0,0,1-2.771.774c-3.429-.46-2.333-3.267-2.2-3.55A3.721,3.721,0,0,1,3512.81,173.815Z" data-name="cloud" id="cloud" className="transition-all duration-250 ease-in-out"></path></g><g fill="#def8ff" transform="translate(3.585 1.325)" id="stars" className={theme === 'game' ? 'opacity-100' : 'opacity-0'}><path transform="matrix(-1, 0.017, -0.017, -1, 24.231, 3.055)" d="M.774,0,.566.559,0,.539.458.933.25,1.492l.485-.361.458.394L1.024.953,1.509.592.943.572Z"></path><path transform="matrix(-0.777, 0.629, -0.629, -0.777, 23.185, 12.358)" d="M1.341.529.836.472.736,0,.505.46,0,.4.4.729l-.231.46L.605.932l.4.326L.9.786Z" data-name="star"></path><path transform="matrix(0.438, 0.899, -0.899, 0.438, 23.177, 29.735)" d="M.015,1.065.475.9l.285.365L.766.772l.46-.164L.745.494.751,0,.481.407,0,.293.285.658Z" data-name="star"></path><path transform="translate(12.677 0.388) rotate(104)" d="M1.161,1.6,1.059,1,1.574.722.962.607.86,0,.613.572,0,.457.446.881.2,1.454l.516-.274Z" data-name="star"></path><path transform="matrix(-0.07, 0.998, -0.998, -0.07, 11.066, 15.457)" d="M.873,1.648l.114-.62L1.579.945,1.03.62,1.144,0,.706.464.157.139.438.7,0,1.167l.592-.083Z" data-name="star"></path><path transform="translate(8.326 28.061) rotate(11)" d="M.593,0,.638.724,0,.982l.7.211.045.724.36-.64.7.211L1.342.935,1.7.294,1.063.552Z" data-name="star"></path><path transform="translate(5.012 5.962) rotate(172)" d="M.816,0,.5.455,0,.311.323.767l-.312.455.516-.215.323.456L.827.911,1.343.7.839.552Z" data-name="star"></path><path transform="translate(2.218 14.616) rotate(169)" d="M1.261,0,.774.571.114.3.487.967,0,1.538.728,1.32l.372.662.047-.749.728-.218L1.215.749Z" data-name="star"></path></g></g></svg>
                        </label>
                    </div>
                    {renderPageContent()}
                </div>
            </div>
            {isChatbotOpen && <ChatbotModal onClose={() => setIsChatbotOpen(false)} addPoints={addPoints} />}
            {viewingNote && <NoteViewModal note={viewingNote} onClose={() => setViewingNote(null)} />}
        </div>
    );
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  return isLoggedIn && user ? <MainApp 
    user={user} 
    setUser={setUser}
    notes={notes}
    setNotes={setNotes}
    currentPage={currentPage}
    setCurrentPage={setCurrentPage}
    theme={theme}
    setTheme={setTheme}
    isChatbotOpen={isChatbotOpen}
    setIsChatbotOpen={setIsChatbotOpen}
    viewingNote={viewingNote}
    setViewingNote={setViewingNote}
    currentTheme={currentTheme}
    addPoints={addPoints}
    updateUserData={updateUserData}
    noteDetails={noteDetails}
    setNoteDetails={setNoteDetails}
    noteSavedMessage={noteSavedMessage}
    setNoteSavedMessage={setNoteSavedMessage}
  /> : <LoginPage />;
};

export default App;