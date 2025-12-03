import React from 'react'
import logo from "../../assets/logo/noctowls_logo_i.svg";

const NoctowlsLogo = ({width}) => {
  return (
    <img className={`${width}`} src={logo} alt="Noctowls_logo.svg" />
  )
}

export default NoctowlsLogo