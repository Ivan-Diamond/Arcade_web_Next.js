'use client'

import { useState, useEffect } from 'react'

interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isTouchDevice: boolean
}

export function useMobileDetect(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isTouchDevice: false,
  })

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''
      const platform = typeof window !== 'undefined' ? navigator.platform : ''
      
      // Check for mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
        (typeof window !== 'undefined' && window.innerWidth <= 768)
      
      // Check for tablets (wider than phones but still touch devices)
      const isTablet = /iPad|Android/i.test(userAgent) && 
        (typeof window !== 'undefined' && window.innerWidth > 768 && window.innerWidth <= 1024)
      
      // Check for iOS
      const isIOS = /iPad|iPhone|iPod/.test(platform) || 
        (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      
      // Check for Android
      const isAndroid = /Android/i.test(userAgent)
      
      // Check for touch capability
      const isTouchDevice = typeof window !== 'undefined' && 
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        isIOS,
        isAndroid,
        isTouchDevice,
      })
    }

    checkDevice()
    
    // Re-check on resize
    const handleResize = () => {
      checkDevice()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return detection
}
