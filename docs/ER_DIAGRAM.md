```mermaid

erDiagram
    Users ||--o{ Photos : has
    Users ||--o{ UserImages : generates
    Users ||--o{ TrainingRuns : trains
    Users ||--o{ InferenceRuns : creates
    Users ||--o{ Payments : makes
    Users ||--o{ CreditTransactions : has
    Feed ||--o{ Users : viewed_by
    Payments ||--o{ CreditTransactions : triggers

    Users {
        ObjectId _id PK
        string email UK
        string full_name
        string hashed_password
        int age NULL
        enum gender
        enum auth_provider
        string picture_url NULL
        string locale NULL
        string given_name NULL
        string family_name NULL
        datetime created_at
        enum subscription_status
        string subscription_id NULL
        enum subscription_plan NULL
        enum subscription_type NULL
        datetime subscription_end_date NULL
        string model_status
        string current_training_id NULL
        string latest_model_version NULL
        string latest_model_weights NULL
        string last_error NULL
        array models
    }

    Payments {
        ObjectId _id PK
        string user_id FK
        float amount
        string currency
        string payment_method
        string status
        int credits_purchased
        datetime created_at
        string transaction_id
    }

    CreditTransactions {
        ObjectId _id PK
        string user_id FK
        string run_id FK NULL
        int amount
        enum transaction_type
        string description
        datetime created_at
    }

    Photos {
        ObjectId _id PK
        string filename
        string content_type
        string user_id FK
        ObjectId file_id FK
        datetime uploaded_at
    }

    UserImages {
        ObjectId _id PK
        string prompt
        string[] image_urls
        string user_id FK
        datetime created_at
    }

    TrainingRuns {
        string training_id PK
        string user_id FK
        string model_name
        string status
        datetime created_at
        string replicate_model_id
        string s3_url
        string version NULL
        string weights NULL
        string error NULL
        datetime completed_at NULL
    }

    InferenceRuns {
        ObjectId _id PK
        string user_id FK
        string model_id
        json parameters
        string status
        datetime created_at
        string prompt
        json processing_stats
        string[] replicate_urls
        string[] output_urls
        datetime completed_at NULL
        string error NULL
    }

    Feed {
        ObjectId _id PK
        string prompt
        datetime created_at
        string s3_url
    }

    GridFS {
        ObjectId _id PK
        binary data
        string filename
        string content_type
    }
```

## Collection Details

### Users Collection
The main collection storing user information and subscription details.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `email`: String (Unique Key)
- `full_name`: String
- `hashed_password`: String
- `age`: Integer (Optional)
- `gender`: Enum ["male", "female", "other", "not_specified"]
- `auth_provider`: Enum ["email", "google"]
- `picture_url`: String (Optional)
- `locale`: String (Optional)
- `given_name`: String (Optional)
- `family_name`: String (Optional)
- `created_at`: DateTime
- `subscription_status`: Enum ["inactive", "active", "cancelled"]
- `subscription_id`: String (Optional)
- `subscription_plan`: Enum ["starter", "pro", "premium"]
- `subscription_type`: Enum ["monthly", "yearly"]
- `subscription_end_date`: DateTime (Optional)
- `model_status`: String
- `current_training_id`: String (Optional)
- `latest_model_version`: String (Optional)
- `latest_model_weights`: String (Optional)
- `last_error`: String (Optional)
- `models`: Array of model objects

### Payments Collection
Records all payment transactions.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `user_id`: String (Foreign Key → Users._id)
- `amount`: Float
- `currency`: String
- `payment_method`: String
- `status`: String ["pending", "completed", "failed", "refunded"]
- `credits_purchased`: Integer
- `created_at`: DateTime
- `transaction_id`: String

### CreditTransactions Collection
Tracks credit usage and purchases.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `user_id`: String (Foreign Key → Users._id)
- `run_id`: String (Foreign Key → InferenceRuns._id, Optional)
- `amount`: Integer
- `transaction_type`: Enum ["purchase", "usage", "refund", "bonus", "expiry"]
- `description`: String
- `created_at`: DateTime

### Photos Collection
Stores metadata for user-uploaded photos.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `filename`: String
- `content_type`: String
- `user_id`: String (Foreign Key → Users._id)
- `file_id`: ObjectId (Reference to GridFS)
- `uploaded_at`: DateTime

### UserImages Collection
Stores generated images and their prompts.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `prompt`: String
- `image_urls`: Array[String]
- `user_id`: String (Foreign Key → Users._id)
- `created_at`: DateTime

### TrainingRuns Collection
Tracks AI model training sessions.

#### Fields:
- `training_id`: String (Primary Key)
- `user_id`: String (Foreign Key → Users._id)
- `model_name`: String
- `status`: String
- `created_at`: DateTime
- `replicate_model_id`: String
- `s3_url`: String
- `version`: String (Optional)
- `weights`: String (Optional)
- `error`: String (Optional)
- `completed_at`: DateTime (Optional)

### InferenceRuns Collection
Tracks image generation inference runs.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `user_id`: String (Foreign Key → Users._id)
- `model_id`: String
- `parameters`: JSON
- `status`: String
- `created_at`: DateTime
- `prompt`: String
- `processing_stats`: JSON
- `replicate_urls`: Array[String]
- `output_urls`: Array[String]
- `completed_at`: DateTime (Optional)
- `error`: String (Optional)

### Feed Collection
Stores example images for the feed.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `prompt`: String
- `created_at`: DateTime
- `s3_url`: String

### GridFS
MongoDB's GridFS system for storing large files.

#### Fields:
- `_id`: ObjectId (Primary Key)
- `data`: Binary
- `filename`: String
- `content_type`: String

## Relationships

1. Users → Photos (One-to-Many)
   - A user can have multiple photos
   - Each photo belongs to one user

2. Users → UserImages (One-to-Many)
   - A user can have multiple generated images
   - Each generated image belongs to one user

3. Users → TrainingRuns (One-to-Many)
   - A user can have multiple training runs
   - Each training run belongs to one user

4. Users → InferenceRuns (One-to-Many)
   - A user can have multiple inference runs
   - Each inference run belongs to one user

5. Photos → GridFS (Many-to-One)
   - Multiple photos can reference the same GridFS file
   - Each photo references one GridFS file

6. Feed → Users (Many-to-Many)
   - Feed examples can be viewed by multiple users
   - Users can view multiple feed examples
