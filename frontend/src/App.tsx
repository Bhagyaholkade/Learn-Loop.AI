
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import CourseDetailsPage from './pages/CourseDetailsPage';
import LessonPage from './pages/LessonPage';
import StudentQuizzesPage from './pages/StudentQuizzesPage';
import StudentQuizAttemptPage from './pages/StudentQuizAttemptPage';
import StudentQuizAttemptsPage from './pages/StudentQuizAttemptsPage';
import QuizInstructionsPage from './pages/QuizInstructionsPage';
import StudentQuizResultPage from './pages/StudentQuizResultPage';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import ManageStudentsPage from './pages/ManageStudentsPage';
import ManageCoursesPage from './pages/ManageCoursesPage';
import ManageEnrollmentsPage from './pages/ManageEnrollmentsPage';
import ManageLessonsPage from './pages/ManageLessonsPage';
import AdminProgressPage from './pages/AdminProgressPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminQuizzesPage from './pages/AdminQuizzesPage';
import AdminQuizQuestionsPage from './pages/AdminQuizQuestionsPage';
import AdminQuizResultsPage from './pages/AdminQuizResultsPage';
import AdminQuizAttemptsPage from './pages/AdminQuizAttemptsPage';

// AI Course Creator
import AiCourseCreatorPage from './pages/AiCourseCreatorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Student Routes */}
        <Route
          element={<ProtectedRoute allowedRoles={['student']} />}
        >
          <Route path="/student" element={<StudentDashboard />} />

          <Route
            path="/student/courses/:courseId"
            element={<CourseDetailsPage />}
          />

          <Route
            path="/student/courses/:courseId/lessons/:lessonId"
            element={<LessonPage />}
          />

          <Route
            path="/student/quizzes"
            element={<StudentQuizzesPage />}
          />

          <Route
            path="/student/quizzes/:quizId/instructions"
            element={<QuizInstructionsPage />}
          />

          {/* Quiz Attempt */}
          <Route
            path="/student/quizzes/:quizId"
            element={<StudentQuizAttemptPage />}
          />

          {/* Quiz History */}
          <Route
            path="/student/quizzes/attempts"
            element={<StudentQuizAttemptsPage />}
          />

          {/* Current Quiz Result */}
          <Route
            path="/student/quizzes/result"
            element={<StudentQuizResultPage />}
          />

          {/* Historical Quiz Result */}
          <Route
            path="/student/quizzes/attempts/:attemptId"
            element={<StudentQuizResultPage />}
          />
        </Route>

        {/* Admin Routes */}
        <Route
          element={<ProtectedRoute allowedRoles={['admin']} />}
        >
          <Route path="/admin" element={<AdminDashboard />} />

          <Route
            path="/admin/students"
            element={<ManageStudentsPage />}
          />

          <Route
            path="/admin/courses"
            element={<ManageCoursesPage />}
          />

          {/* AI Course Creator */}
          <Route
            path="/admin/ai-course-creator"
            element={<AiCourseCreatorPage />}
          />

          <Route
            path="/admin/enrollments"
            element={<ManageEnrollmentsPage />}
          />

          <Route
            path="/admin/lessons"
            element={<ManageLessonsPage />}
          />

          <Route
            path="/admin/quizzes"
            element={<AdminQuizzesPage />}
          />

          <Route
            path="/admin/quizzes/:quizId/questions"
            element={<AdminQuizQuestionsPage />}
          />

          <Route
            path="/admin/progress"
            element={<AdminProgressPage />}
          />

          <Route
            path="/admin/analytics"
            element={<AdminAnalyticsPage />}
          />

          <Route
            path="/admin/quiz-results"
            element={<AdminQuizResultsPage />}
          />

          <Route
            path="/admin/quiz-attempts"
            element={<AdminQuizAttemptsPage />}
          />
        </Route>

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Not Found */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
