import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Check if user is authenticated and is a manager
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a manager
    if (!(session.user as any).isManager) {
      return NextResponse.json(
        { error: 'Forbidden - Manager access required' },
        { status: 403 }
      )
    }

    // Read feedback files from the public/feedbacks directory
    const feedbacksDir = path.join(process.cwd(), 'public', 'feedbacks')
    
    // Create directory if it doesn't exist
    try {
      await fs.access(feedbacksDir)
    } catch {
      await fs.mkdir(feedbacksDir, { recursive: true })
      return NextResponse.json({ feedbacks: [] })
    }

    // Get all .txt files from the feedbacks directory
    const files = await fs.readdir(feedbacksDir)
    const feedbackFiles = files.filter(file => file.endsWith('.txt'))

    const feedbacks = []

    for (const file of feedbackFiles) {
      try {
        const filePath = path.join(feedbacksDir, file)
        const content = await fs.readFile(filePath, 'utf8')

        // Parse filename: timestamp_title_userId.txt
        const fileNameWithoutExt = file.replace('.txt', '')
        const parts = fileNameWithoutExt.split('_')
        
        if (parts.length >= 3) {
          const timestamp = parts[0]
          const userId = parts[parts.length - 1]
          const title = parts.slice(1, -1).join('_')

          // Parse content to extract userName and text
          const lines = content.split('\n')
          let userName = 'Unknown User'
          let text = content
          let actualTitle = title // Use filename title as fallback

          // Parse the structured feedback format
          let contentStartIndex = -1
          let actualTimestamp = timestamp // Use filename timestamp as fallback
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith('User Name: ')) {
              userName = line.replace('User Name: ', '').trim()
            } else if (line.startsWith('Title: ')) {
              actualTitle = line.replace('Title: ', '').trim()
            } else if (line.startsWith('Timestamp: ')) {
              // Extract the ISO timestamp from the file content
              actualTimestamp = line.replace('Timestamp: ', '').trim()
            } else if (line === 'Content:' || line === '--------') {
              // Find the start of actual content after "Content:" and "--------"
              for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() === '--------') {
                  contentStartIndex = j + 1
                  break
                } else if (lines[j].trim() !== '' && contentStartIndex === -1) {
                  contentStartIndex = j
                  break
                }
              }
              if (contentStartIndex !== -1) {
                break
              }
            }
          }

          // Extract the actual feedback content
          if (contentStartIndex !== -1) {
            text = lines.slice(contentStartIndex).join('\n').trim()
          }

          feedbacks.push({
            fileName: file,
            userId,
            userName,
            title: actualTitle,
            text,
            timestamp: actualTimestamp,
            date: new Date(actualTimestamp)
          })
        }
      } catch (error) {
        console.error(`Error reading feedback file ${file}:`, error)
      }
    }

    // Sort feedbacks by date (newest first)
    feedbacks.sort((a, b) => b.date.getTime() - a.date.getTime())

    return NextResponse.json({ feedbacks })
  } catch (error) {
    console.error('Error listing feedbacks:', error)
    return NextResponse.json(
      { error: 'Failed to list feedbacks' },
      { status: 500 }
    )
  }
}
