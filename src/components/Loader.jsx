import React, { use, useRef } from 'react'
import Three from './Three'
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
const Loader = () => {
  const loaderRef = useRef(null);
  const textRef = useRef(null);
  useGSAP(()=>{
    setTimeout(()=>{
      gsap.to(loaderRef.current,{
        x: '-100%',
        rotate:360,
        opacity:0,
        duration:1,
        ease:'power2.inOut',
        onComplete:()=>{
          loaderRef.current.style.display='none'
        }
      })
    },8000)
  })

  useGSAP(() => {
    gsap.from(textRef.current, {
      y: 150,
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: 'expo.inOut',
      stagger: 0.7
    })
  })
  return (
    <div ref={loaderRef} className='loader-container'>
      <Three />
      <h3 ref={textRef}>Flow.ai...</h3>
    </div>
  )
}

export default Loader