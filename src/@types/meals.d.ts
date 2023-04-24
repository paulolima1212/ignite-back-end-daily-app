export interface Meals {
  meals: string
}

export interface Meal {
  id: string
  name: string
  description: string
  is_diet: boolean
  created_at: Date
  user_id: string
}
