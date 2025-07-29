export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const headers = {
  "Content-Type": "application/json",
  ...corsHeaders,
}

export const errorMap: Record<string, string> = {
  // Supabase / PostgreSQL error codes
  "23502": "Some required information is missing. Please fill in all fields.",
  "23503": "Something went wrong. Please try again or contact support.", // overridden below if user_id is involved
  "23505": "This already exists. Please use a different value.",
  "22001": "Input is too long. Please shorten your entry.",
  "22003": "The number is too large. Please enter a smaller value.",
  "23514": "Invalid value. Please check your input and try again.",
  "22007": "Invalid date format. Please use a valid date.",
  "22P02": "Invalid input format. Please check your entry.",
  "28P01": "Incorrect username or password.",
  "42601": "There was a system error. Please try again later.",
  "42501": "You don't have permission to do this.",
};

export const jsonResponse = ({
  data,
  error,
  status,
}: {
  data: any,
  error: any,
  status?: number,
}) => {
  const response = error ? {
    data: null,
    error: {
      msg: errorMap[error.code] || error.msg || "unknown error",
    }
  } : {
    data,
    error: null,
  }

  return new Response(
    JSON.stringify(response),
    {
      status: status ?? (error ? 500 : 200),
      headers,
    }
  );
}

export const corsJsonResponse = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  })
}