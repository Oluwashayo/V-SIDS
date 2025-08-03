import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, image_b64 } = await request.json()

    // Validate input
    if (!question) {
      return NextResponse.json({ error: "Missing required field: question" }, { status: 400 })
    }

    // If no image is provided, return a message encouraging image upload
    if (!image_b64 || image_b64 === "no-image") {
      return NextResponse.json({
        response: `I'd be happy to help with your skin concern: "${question}"

However, for the most accurate analysis, I recommend uploading a clear image of the area you're concerned about. This will allow me to provide more specific and helpful guidance.

**General Skin Health Tips:**
- Keep the area clean and dry
- Avoid harsh soaps or irritating products
- Protect from sun exposure with appropriate sunscreen
- Monitor any changes in size, color, or texture

**When to Seek Medical Attention:**
- Any rapidly changing or growing lesions
- Persistent itching, bleeding, or pain
- New growths or moles that appear different from others
- Any concerning changes in existing moles or spots

Please upload an image for a more detailed analysis, and remember to consult with a dermatologist for professional medical evaluation.`,
        timestamp: new Date().toISOString(),
      })
    }

    try {
      // Make request to your updated API endpoint
      const response = await fetch("https://llava-rag-api.vercel.app/rag-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "V-SIDS/1.0",
        },
        body: JSON.stringify({
          image_b64: image_b64,
          question: question,
        }),
        signal: AbortSignal.timeout(45000), // 45 second timeout
      })

      // Log response details for debugging
      console.log("API Response Status:", response.status)
      console.log("API Response Headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error:", response.status, errorText)

        // Handle specific error cases
        if (response.status === 405) {
          return NextResponse.json(
            { error: "The analysis service endpoint is not configured correctly. Please try again later." },
            { status: 503 },
          )
        } else if (response.status === 400) {
          return NextResponse.json({ error: "Invalid request format or image data" }, { status: 400 })
        } else if (response.status === 429) {
          return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
        } else if (response.status >= 500) {
          return NextResponse.json(
            { error: "Service temporarily unavailable. Please try again later." },
            { status: 503 },
          )
        } else {
          return NextResponse.json({ error: "Analysis service is currently unavailable" }, { status: 503 })
        }
      }

      const data = await response.json()
      console.log("API Response Data:", data)

      // Check if the response contains an error message from LLaVA
      if (data.answer && data.answer.includes("LLaVA Error")) {
        console.error("LLaVA API error:", data.answer)
        return NextResponse.json({
          response: "I apologize, but the image analysis service is currently experiencing technical difficulties. Please try again in a few moments, or consult with a dermatologist for immediate medical advice.",
          timestamp: new Date().toISOString(),
        })
      }

      // Extract the response text from the API response
      const responseText = extractResponseText(data)

      return NextResponse.json({
        response: responseText + getDisclaimer(),
        timestamp: new Date().toISOString(),
      })
    } catch (fetchError) {
      console.error("Fetch error:", fetchError)

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout. Please try again with a smaller image." }, { status: 408 })
      }

      return NextResponse.json({
        response:
          "I apologize, but I'm currently unable to analyze your image due to a network issue. Please check your internet connection and try again.",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("API route error:", error)

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    return NextResponse.json({
      response:
        "I apologize, but I encountered an unexpected error. Please try again later or consult with a healthcare professional for proper diagnosis.",
      timestamp: new Date().toISOString(),
    })
  }
}

// Helper function to extract response text from various response formats
function extractResponseText(data: any): string {
  if (typeof data === "string") {
    return data
  } else if (data.response) {
    return data.response
  } else if (data.answer) {
    return data.answer
  } else if (data.result) {
    return data.result
  } else if (data.text) {
    return data.text
  } else if (data.message) {
    return data.message
  } else if (data.content) {
    return data.content
  } else if (data.analysis) {
    return data.analysis
  } else if (data.diagnosis) {
    return data.diagnosis
  } else if (Array.isArray(data) && data.length > 0) {
    return extractResponseText(data[0])
  } else {
    return "I was able to analyze your image, but the response format was unexpected. Please try again or consult with a healthcare professional."
  }
}

// Helper function to get medical disclaimer
function getDisclaimer(): string {
  return "\n\n⚠️ **Medical Disclaimer**: V-SIDS can make mistakes. Please consult with a qualified dermatologist or healthcare provider for proper diagnosis and treatment."
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
