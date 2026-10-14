import {createBrowserRouter} from 'react-router';
import Register from './features/auth/pages/Register.jsx';
import Login from './features/auth/pages/Login.jsx';
import ForgotPassword from './features/auth/pages/ForgotPassword.jsx';
import Protected from './features/auth/components/Protected.jsx'
import Home from './features/interview/pages/Home.jsx';
import Interview from './features/interview/pages/Interview.jsx';
import PageNotFound from './features/interview/components/PageNotFound.jsx';



export const router = createBrowserRouter([
     {
        path : '/register',
        element : <Register />
     } ,
     {
        path : '/login',
        element : <Login />
     } ,
     {
        path : '/forgot-password',
        element : <ForgotPassword />
     } ,
     {
      path : '/',
      element :<Protected><Home/></Protected>
     } ,
     {
      path : '/interview/:interviewId',
      element : <Protected><Interview /></Protected>
     }, {
      path : '*' ,
      element : <PageNotFound />
     }
   ])
