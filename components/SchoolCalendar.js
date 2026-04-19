import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import htm from 'htm';

const html = htm.bind(h);

export const SchoolCalendar = ({ data, isAdmin }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '', type: 'event', details: '' });

    const calendarData = useMemo(() => data.calendar || [], [data.calendar]);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

    const eventsForDay = (day) => {
        const dateStr = `${year}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarData.filter(e => e.start === dateStr || (e.start <= dateStr && e.end >= dateStr));
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!window.googleSync) return;
        
        const result = await window.googleSync.pushCalendar({
            ...newEvent,
            id: 'EVT-' + Date.now()
        });

        if (result.success) {
            alert('Event added successfully!');
            setShowAddModal(false);
            // Refresh data via window event if needed
            window.dispatchEvent(new CustomEvent('edutrack:data-refresh'));
        }
    };

    const calendarGrid = useMemo(() => {
        const days = [];
        const totalDays = daysInMonth(viewDate);
        const startOffset = firstDayOfMonth(viewDate);

        // Fill previous month padding
        for (let i = 0; i < startOffset; i++) days.push(null);

        // Fill current month
        for (let i = 1; i <= totalDays; i++) days.push(i);

        return days;
    }, [viewDate]);

    return html`
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight">School <span class="text-indigo-600">Calendar</span></h1>
                    <p class="text-slate-500 font-medium">Academic events and important dates</p>
                </div>
                ${isAdmin && html`
                    <button onClick=${() => setShowAddModal(true)} class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                        <span>➕</span> Add Event
                    </button>
                `}
            </header>

            <div class="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
                <!-- Calendar Controls -->
                <div class="flex items-center justify-between mb-8">
                    <h2 class="text-2xl font-black text-slate-900 dark:text-white">${monthName} <span class="text-slate-400 font-medium">${year}</span></h2>
                    <div class="flex gap-2">
                        <button onClick=${prevMonth} class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-colors">◀️</button>
                        <button onClick=${() => setViewDate(new Date())} class="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Today</button>
                        <button onClick=${nextMonth} class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-colors">▶️</button>
                    </div>
                </div>

                <!-- Calendar Grid -->
                <div class="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => html`
                        <div class="bg-slate-50 dark:bg-slate-900/50 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-inherit">${day}</div>
                    `)}
                    
                    ${calendarGrid.map((day, idx) => {
                        const dayEvents = day ? eventsForDay(day) : [];
                        const isToday = day && new Date().toDateString() === new Date(year, viewDate.getMonth(), day).toDateString();

                        return html`
                            <div class=${`min-h-[120px] bg-white dark:bg-slate-900 p-2 group transition-colors ${day ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-50/50 dark:bg-slate-950/20'}`}>
                                ${day && html`
                                    <div class="flex justify-between items-start mb-2">
                                        <span class=${`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                                            ${day}
                                        </span>
                                    </div>
                                    <div class="space-y-1">
                                        ${dayEvents.map(event => html`
                                            <div class=${`px-2 py-1 rounded text-[9px] font-bold truncate cursor-pointer transition-transform hover:scale-105 ${
                                                event.type === 'holiday' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                                                event.type === 'exam' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                                                'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                                            }`} title=${event.title + ': ' + (event.details || '')}>
                                                ${event.title}
                                            </div>
                                        `)}
                                    </div>
                                `}
                            </div>
                        `;
                    })}
                </div>
            </div>

            <!-- Upcoming Events List -->
            <section class="mt-12">
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span class="bg-indigo-600 w-2 h-2 rounded-full"></span> Upcoming School Events
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${calendarData.filter(e => new Date(e.start) >= new Date()).slice(0, 4).map(event => html`
                        <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div class=${`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black shrink-0 ${
                                event.type === 'holiday' ? 'bg-red-500' : event.type === 'exam' ? 'bg-orange-500' : 'bg-indigo-500'
                            }`}>
                                <span class="text-[10px] uppercase">${new Date(event.start).toLocaleString('default', { month: 'short' })}</span>
                                <span class="text-xl">${new Date(event.start).getDate()}</span>
                            </div>
                            <div>
                                <h4 class="font-black text-slate-900 dark:text-white">${event.title}</h4>
                                <p class="text-xs text-slate-500 mt-1 line-clamp-2">${event.details || 'No additional details provided.'}</p>
                                <div class="mt-2 flex items-center gap-2">
                                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-widest">${event.type}</span>
                                    ${event.term && html`<span class="text-[10px] text-slate-400 font-medium">${event.term}</span>`}
                                </div>
                            </div>
                        </div>
                    `)}
                </div>
            </section>

            <!-- Add Event Modal -->
            ${showAddModal && html`
                <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-scale-up">
                        <div class="p-8">
                            <div class="flex justify-between items-center mb-8">
                                <h2 class="text-2xl font-black text-slate-900 dark:text-white">Add Calendar Event</h2>
                                <button onClick=${() => setShowAddModal(false)} class="text-slate-500 hover:text-slate-900 dark:hover:text-white">✕</button>
                            </div>
                            <form onSubmit=${handleAddEvent} class="space-y-4">
                                <div>
                                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Title</label>
                                    <input type="text" value=${newEvent.title} onInput=${e => setNewEvent({...newEvent, title: e.target.value})} class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Start Date</label>
                                        <input type="date" value=${newEvent.start} onInput=${e => setNewEvent({...newEvent, start: e.target.value})} class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">End Date</label>
                                        <input type="date" value=${newEvent.end} onInput=${e => setNewEvent({...newEvent, end: e.target.value})} class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Event Type</label>
                                    <select value=${newEvent.type} onChange=${e => setNewEvent({...newEvent, type: e.target.value})} class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="event">General Event</option>
                                        <option value="exam">Examination</option>
                                        <option value="holiday">School Holiday</option>
                                        <option value="meeting">Meeting</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Details</label>
                                    <textarea value=${newEvent.details} onInput=${e => setNewEvent({...newEvent, details: e.target.value})} class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none h-24" />
                                </div>
                                <button type="submit" class="w-full bg-indigo-600 text-white font-black uppercase py-4 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Save Event</button>
                            </form>
                        </div>
                    </div>
                </div>
            `}
        </div>
    `;
};
