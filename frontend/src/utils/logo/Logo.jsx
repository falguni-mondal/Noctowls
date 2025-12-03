import React from 'react'
import logo from "../../assets/logo/logo.svg";
import { Link } from 'react-router-dom';

const Logo = ({width}) => {
  return (
    <Link to="/"><img className={`${width}`} src={logo} alt="Noctowls_logo.svg" /></Link>
  )
}

export default Logo