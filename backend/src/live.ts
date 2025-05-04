// src/live.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Express } from 'express';

interface RoomInfo {
  room: string;
  studentId: string;
}

// Cache the last question per room for late‐joiners
const lastQuestionByRoom: Record<string, any> = {};

// Track which students are actively joined per room
const activeStudents: Record<string, Set<string>> = {};

// Map socket IDs to their room & studentId (for cleanup)
const socketToRoomAndId: Record<string, RoomInfo> = {};

// Track how many answers we expect & which IDs have answered
const expectedAnswers: Record<string, number> = {};
const answeredIds: Record<string, Set<string>> = {};

// PIN ↔ quizId maps
const pinToQuiz = new Map<string, number>();
const quizToPin = new Map<number, string>();

// Export so other parts of your app can know which quizzes are live
export const liveQuizzes = new Set<number>();

export function initLiveServer(app: Express) {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: ['http://localhost:5173'] },
    maxHttpBufferSize: 1e8,
  });

  const live = io.of('/live');

  live.on('connection', socket => {
    // Teacher generates / reuses a game PIN
    socket.on('start_live', (quizId: number) => {
      const room = `quiz_${quizId}`;
      let pin = quizToPin.get(quizId);
      if (!pin) {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        quizToPin.set(quizId, pin);
        pinToQuiz.set(pin, quizId);
      }
      socket.join(room);
      liveQuizzes.add(quizId);
      socket.emit('quiz_pin', pin);
    });

    // Teacher presses "Start Quiz"
    socket.on('quiz_started', (quizId: number) => {
      const room = `quiz_${quizId}`;
      live.to(room).emit('quiz_started');
    });

    // Student joins by PIN (must send { pin, studentId })
    socket.on('join_by_pin', async (data: { pin: string; studentId: string }) => {
      const quizId = pinToQuiz.get(data.pin);
      if (!quizId) {
        socket.emit('pin_invalid');
        return;
      }
      const room = `quiz_${quizId}`;
      socket.join(room);

      // Track this student's presence
      socketToRoomAndId[socket.id] = { room, studentId: data.studentId };
      if (!activeStudents[room]) {
        activeStudents[room] = new Set();
      }
      activeStudents[room].add(data.studentId);

      // Send any cached question
      const last = lastQuestionByRoom[room];
      if (last) socket.emit('new_question', last);

      // Broadcast updated unique student count
      const count = activeStudents[room].size;
      live.to(room).emit('student_count', count);

      socket.emit('pin_valid', quizId);
    });

    // Backward‐compatible join by quizId (teacher use & late‐joiners)
    socket.on('join_quiz', (quizId: number) => {
      const room = `quiz_${quizId}`;
      socket.join(room);
      liveQuizzes.add(quizId);

      // Resend last question if exists
      const last = lastQuestionByRoom[room];
      if (last) socket.emit('new_question', last);
    });

    // Teacher requests current student count
    socket.on('get_student_count', (quizId: number) => {
      const room = `quiz_${quizId}`;
      const count = activeStudents[room]?.size ?? 0;
      socket.emit('student_count', count);
    });

    // Clean up when socket disconnects
    socket.on('disconnect', () => {
      const info = socketToRoomAndId[socket.id];
      if (info) {
        const { room, studentId } = info;
        activeStudents[room]?.delete(studentId);
        live.to(room).emit('student_count', activeStudents[room].size);
        delete socketToRoomAndId[socket.id];
      }
    });

    // Teacher broadcasts a new question
    socket.on('new_question', async (data: { quizId: number; question: any }) => {
      const room = `quiz_${data.quizId}`;
      // Cache question for late‐joiners
      lastQuestionByRoom[room] = data.question;
      // Reset answer tracking
      answeredIds[room] = new Set();
      expectedAnswers[room] = activeStudents[room]?.size ?? 0;
      // Send to all students
      live.to(room).emit('new_question', data.question);
    });

    // Fallback: student requests current question
    socket.on('get_current_question', (quizId: number) => {
      const room = `quiz_${quizId}`;
      const q = lastQuestionByRoom[room];
      if (q) socket.emit('new_question', q);
    });

    // Student submits an answer
    socket.on('submit_answer', (data: { quizId: number; studentId: string; symbol: string }) => {
      const room = `quiz_${data.quizId}`;
      // Record unique submitter
      if (!answeredIds[room]) answeredIds[room] = new Set();
      answeredIds[room].add(data.studentId);
      // Broadcast arrival
      live.to(room).emit('answer_received', data);
      // If all expected have answered, end question
      if (answeredIds[room].size >= (expectedAnswers[room] || 0)) {
        live.to(room).emit('question_ended');
      }
    });

    // Teacher ends the quiz
    socket.on('end_quiz', (quizId: number, ack?: () => void) => {
      const room = `quiz_${quizId}`;
      live.to(room).emit('quiz_ended');
      liveQuizzes.delete(quizId);
      if (typeof ack === 'function') ack();
    });
  });

  return httpServer;
}
