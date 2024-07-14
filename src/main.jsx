import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import registerCard from "./utilities/registerCard.ts";


//var dom = ReactDOM.createRoot(document.getElementById('root')).render(
//  <React.StrictMode>
//    <App />
//  </React.StrictMode>,
//)

registerCard("electricity-flow-card", App);