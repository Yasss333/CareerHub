import {useEffect,useRef,useState} from 'react'

export function useInterviewFullscreen() {
  const [fullscreen,setFullscreen]=useState(!!document.fullscreenElement)
  const [ready,setReady]=useState(!!document.fullscreenElement)
  const [error,setError]=useState('')
  const [entering,setEntering]=useState(false)
  const exitTimer=useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(()=>{
    clearTimeout(exitTimer.current)
    const changed=()=>{const active=!!document.fullscreenElement;setFullscreen(active);if(active)setReady(true)}
    document.addEventListener('fullscreenchange',changed)
    return ()=>{document.removeEventListener('fullscreenchange',changed);exitTimer.current=setTimeout(()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>undefined)},0)}
  },[])
  const enter=async()=>{
    setError('');setEntering(true)
    try {
      if(!document.documentElement.requestFullscreen)throw new Error('Fullscreen is unavailable in this browser. Open CareerHub in desktop Chrome or Edge.')
      // Keep this request in the click handler: resumed tabs have no retained user activation.
      await document.documentElement.requestFullscreen({navigationUI:'hide'})
      if(!document.fullscreenElement)throw new Error('Your browser blocked fullscreen. Please try again or open CareerHub in Chrome or Edge.')
      setFullscreen(true);setReady(true)
    }catch(err){setError(err instanceof Error && err.message.startsWith('Fullscreen is unavailable')?err.message:'Your browser blocked fullscreen. Please try again or open CareerHub in Chrome or Edge.')}
    finally{setEntering(false)}
  }
  return {fullscreen,ready,enter,error,entering}
}
