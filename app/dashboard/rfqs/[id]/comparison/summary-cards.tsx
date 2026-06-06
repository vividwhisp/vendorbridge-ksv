"use client"

import { TrendingDown, TrendingUp, Target, Users, Award } from "lucide-react"

interface SummaryProps {
  totalQuotations: number
  lowestBid: number
  highestBid: number
  averageBid: number
  recommendedVendor: { id: string; name: string; score: number } | null
}

const cardClass = "rounded-lg border p-4 space-y-1"

export function SummaryCards({
  totalQuotations,
  lowestBid,
  highestBid,
  averageBid,
  recommendedVendor,
}: SummaryProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <div className={cardClass}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>Total</span>
        </div>
        <p className="text-2xl font-bold">{totalQuotations}</p>
        <p className="text-xs text-muted-foreground">quotations received</p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingDown className="size-4 text-green-600" />
          <span>Lowest Bid</span>
        </div>
        <p className="text-2xl font-bold">₹{lowestBid.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">best price</p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="size-4 text-red-600" />
          <span>Highest Bid</span>
        </div>
        <p className="text-2xl font-bold">₹{highestBid.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">highest price</p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="size-4 text-blue-600" />
          <span>Average Bid</span>
        </div>
        <p className="text-2xl font-bold">₹{averageBid.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">across all vendors</p>
      </div>

      <div className={cardClass + " border-green-200 bg-green-50/50"}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Award className="size-4 text-amber-600" />
          <span>Recommended</span>
        </div>
        <p className="text-lg font-bold truncate">
          {recommendedVendor ? recommendedVendor.name : "—"}
        </p>
        {recommendedVendor && (
          <p className="text-xs text-muted-foreground">
            Score: {recommendedVendor.score}
          </p>
        )}
      </div>
    </div>
  )
}
