import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { writeFile } from 'fs/promises'
import { join } from 'path'
import type { FeedbackData, FeedbackSubmitRequest } from '@/lib/types/feedback'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const { title, text }: FeedbackSubmitRequest = await request.json()
    
    // Validation
    if (!title?.trim() || !text?.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'Title and text are required' 
      }, { status: 400 })
    }

    if (title.trim().length > 100) {
      return NextResponse.json({ 
        success: false,
        error: 'Title must be 100 characters or less' 
      }, { status: 400 })
    }

    if (text.trim().length > 1000) {
      return NextResponse.json({ 
        success: false,
        error: 'Text must be 1000 characters or less' 
      }, { status: 400 })
    }

    // Create feedback data
    const timestamp = Date.now().toString()
    const feedbackData: FeedbackData = {
      userId: session.user.id,
      userName: session.user.name || session.user.email || 'Unknown',
      title: title.trim(),
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    // Sanitize title for filename (remove special characters)
    const sanitizedTitle = title.trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)

    // Create filename: timestamp_title_userId.txt
    const filename = `${timestamp}_${sanitizedTitle}_${session.user.id}.txt`
    
    // Create file content
    const fileContent = `FEEDBACK SUBMISSION
==================
User ID: ${feedbackData.userId}
User Name: ${feedbackData.userName}
Title: ${feedbackData.title}
Timestamp: ${feedbackData.timestamp}

Content:
--------
${feedbackData.text}
`

    // Write to public/feedbacks directory
    const feedbacksDir = join(process.cwd(), 'public', 'feedbacks')
    const filePath = join(feedbacksDir, filename)
    
    await writeFile(filePath, fileContent, 'utf8')
    
    console.log('Feedback saved successfully:', filename)

    return NextResponse.json({
      success: true,
      filename: filename
    })

  } catch (error) {
    console.error('Error saving feedback:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to save feedback' 
    }, { status: 500 })
  }
}
