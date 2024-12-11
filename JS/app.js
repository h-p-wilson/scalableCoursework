// Constants for REST API Endpoints
const PostVideo = "https://prod-27.northeurope.logic.azure.com/workflows/e0d5a56e31dc41999c5bd9533e0d82b1/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/videos?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=rQYSNm4hpv8_T1EhEMpF1fT2KUtSKyCYtPky1yOBccc";
const GetAllVideos = "https://prod-42.northeurope.logic.azure.com/workflows/42c3c726fb884ded8f97eb38d7b839d3/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/videos?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=aNH89wOGUVmGXcjOpTrlMZ_ydCPKxe43Dm-cVJ3iVBM";
const SearchVideos = 'https://prod-17.northeurope.logic.azure.com/workflows/3d97e61b4a434415aef808ece775200c/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/videos/"{search}"?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=kfXEBUg4cP6kT5zD9qbdpioVlNv0iy7SyLZCZ9KY0W4';
const LikeDislike = 'https://prod-19.northeurope.logic.azure.com/workflows/c61da661267a4600b40a3df192123ccd/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/videos/like/"{id}"/{action}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=hVNOrPPV1tJBHJklwsQm_ZtONPKilrc60hmksVRBqpU';
const getComments = 'https://prod-22.northcentralus.logic.azure.com/workflows/9793e211c3a6433d9a3362d2fef55974/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/comments/"{id}"?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=RyAAn6P1kpYbXkswcIQ3qfPKu21PxoCna0A7W-so53U';
const postComments = "https://prod-01.northcentralus.logic.azure.com:443/workflows/9bbeb7eb41fe41da9222a16bab907493/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=pCr0R78hvSgQlWnNt-W2FVSuWRvqyuZjrZ0wGzbYC1E"
const BLOB_ACCOUNT = "http://blobstoragehephzic2.blob.core.windows.net";

// Settiing up webpages
$(document).ready(function() {
  const currentPath = window.location.pathname;

  if (currentPath.endsWith("index.html")) {
    getVideos();
  }

  if (currentPath.endsWith("post-video.html")) {
    $('#subNewForm').click(function() {
      submitNewVideo();
    });
  }

  if (currentPath.endsWith("search.html")) {
    $('#searchButton').click(function(event) {
      event.preventDefault();  // Prevent form submission

      const query = $('#searchInput').val().trim();
      if (query) {
        searchVideos(query);
      } else {
        alert("Please enter a title to search.");
      }
    });
  }
});

const auth0 = new Auth0Client({
  domain: 'dev-ehk4lfu315h38io1.us.auth0.com',   // You can find this in your Auth0 settings
  client_id: 'ZHh2FBRN17IJbpEediVPMrrY0i5Jb2jX',   // You can find this in your Auth0 app settings
});

// When the user clicks the login button
document.getElementById("login-button").addEventListener("click", async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin // This is the URL users will be redirected to after login
  });
});

window.addEventListener('load', async () => {
  // Check if the URL contains the callback information
  const query = window.location.search;
  if (query.includes('code') && query.includes('state')) {
    // Parse the callback information and complete the login
    await auth0.handleRedirectCallback();
  }

  // Get the logged-in user information
  const user = await auth0.getUser();
  
  if (user) {
    console.log(user);  // Output user details (such as name, email) in the console
    // Optionally display the user info in the UI
    document.getElementById('login-button').textContent = `Hello, ${user.name}`;
    // Optionally hide the login button or show a logout button
  }
});




function updateVideoLikeStatus(videoId, action) {
  // Replace 'like' with 1 and 'dislike' with -1
  const actionValue = (action === "like") ? 1 : (action === "dislike" ? -1 : 0);

  const uri = LikeDislike.replace("{id}", videoId).replace("{action}", actionValue);

  // Find the likes count element for this video
  const likesElement = $(`.likes-count[data-video-id='${videoId}']`);

  // Get the current like count and update it
  let currentLikesCount = parseInt(likesElement.text()) || 0;

  // Update likes based on action (increment or decrement)
  if (actionValue === 1) {
    currentLikesCount += 1;  // Increment the like count
  } else if (actionValue === -1) {
    currentLikesCount -= 1;  // Decrement the like count
  }

  // Update the UI immediately with the new like count
  likesElement.text(currentLikesCount);

  // Send the like/dislike action to the API (simulate server update)
  const requestBody = {
    videoID: videoId,
    action: actionValue  // Sending 1 for like, -1 for dislike
  };

  $.ajax({
    url: uri,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestBody),
    success: function(data) {
      console.log("Like/Dislike updated on server:", data);
      // Optionally, you can update the UI based on the server response (if it returns any data)
    },
    error: function(error) {
      console.error("Error updating like/dislike", error);
      // If the request fails, you could optionally revert the count change, or notify the user
    }
  });
}


// Function to search and display videos by title
function searchVideos(query) {
  // Display a loading spinner
  $('#SearchResults').html('<img class="prawn-spinner" src="images/prawn.png" alt="Prawn" />');

  // Make a request to the search endpoint
  $.getJSON(SearchVideos.replace("{search}", encodeURIComponent(query)), function(data) {
    if (data.length === 0) {
      $('#SearchResults').html("<p>No videos found.</p>");
      return;
    }

    const items = [];
    data.forEach(function(val) {
      items.push(renderVideo(val)); // Use the renderVideo function to build video card HTML
    });

    // Replace loading spinner with search results
    $('#SearchResults').html(items.join(""));

    // Add event listeners for like/dislike buttons after content is inserted
    $('.like-btn').click(function() {
      const videoId = $(this).data('video-id');
      updateVideoLikeStatus(videoId, 'like');  // Pass 'like' as action
    });
    
    $('.dislike-btn').click(function() {
      const videoId = $(this).data('video-id');
      updateVideoLikeStatus(videoId, 'dislike');  // Pass 'dislike' as action
    });

    // Add event listener for toggle buttons
    $('.toggle-btn').click(function() {
      var $cardBody = $(this).closest('.card-body');
      var $additionalInfo = $cardBody.find('.additional-info');
      
      // Toggle visibility of additional info
      $additionalInfo.toggle();
      
      // Change button text based on visibility
      if ($additionalInfo.is(":visible")) {
        $(this).text("Show Less");
      } else {
        $(this).text("Show More");
      }
    });
  }).fail(function(xhr, status, error) {
    $('#SearchResults').html("<p>Error loading search results.</p>");
    console.error("Error fetching search results:", error);
  });
}

// Function to submit a new video
function submitNewVideo() {
  const formData = new FormData();

  // Collect form data
  formData.append('FileName', $('#FileName').val());
  formData.append('UserID', $('#userID').val());
  formData.append('userName', $('#userName').val());
  formData.append('title', $('#title').val());
  formData.append('publisher', $('#publisher').val());
  formData.append('producer', $('#producer').val());
  formData.append('genre', $('#genre').val());
  formData.append('rating', $('#rating').val());
  formData.append('File', $('#UpFile')[0].files[0]);

  // Submit via AJAX
  $.ajax({
    url: PostVideo,
    data: formData,
    cache: false,
    enctype: 'multipart/form-data',
    contentType: false,
    processData: false,
    type: 'POST',
    success: function() {
      alert('Video uploaded successfully!');
      // Optionally redirect to the dashboard
      window.location.href = "index.html";
    },
    error: function(xhr, status, error) {
      alert('Error uploading video: ' + error);
    }
  });
}


// Function to retrieve and display videos
function getVideos() {
  // Display a loading spinner
  $('#ImageList').html('<img class="prawn-spinner" src="images/prawn.png" alt="Prawn" />');

  // Fetch video data
  $.getJSON(GetAllVideos, function(data) {
    const items = [];

    data.forEach(function(val) {
      items.push(renderVideo(val)); // Reuse the renderVideo function
    });

    // Replace loading spinner with video list
    $('#ImageList').html(items.join(""));

    // Add event listeners for like/dislike buttons
    $('.like-btn').click(function() {
      const videoId = $(this).data('video-id');
      updateVideoLikeStatus(videoId, 'like');  // Send 'like' action
    });

    $('.dislike-btn').click(function() {
      const videoId = $(this).data('video-id');
      updateVideoLikeStatus(videoId, 'dislike');  // Send 'dislike' action
    });

    // Add event listener for toggle buttons
    $('.toggle-btn').click(function() {
      var $cardBody = $(this).closest('.card-body');
      var $additionalInfo = $cardBody.find('.additional-info');
      
      // Toggle visibility of additional info
      $additionalInfo.toggle();
      
      // Change button text based on visibility
      if ($additionalInfo.is(":visible")) {
        $(this).text("Show Less");
      } else {
        $(this).text("Show More");
      }
    });
  }).fail(function(xhr, status, error) {
    $('#ImageList').html("<p>Error loading videos.</p>");
    console.error("Error fetching videos:", error);
  });
}

function renderVideo(val) {
  const videoCard = [];
  videoCard.push("<div class='card mb-4'>");
  videoCard.push("<div class='card-body'>");

  if (val["filepath"]) {
    videoCard.push(
      `<div class="video-container mb-3">
         <video class="w-100" controls>
           <source src='${BLOB_ACCOUNT + val["filepath"]}' type='video/mp4'>
           Your browser does not support the video tag.
         </video>
       </div>`
    );
  } else {
    videoCard.push("<p class='text-danger'>File path is missing or invalid</p>");
  }



  videoCard.push(`
    <div class="like-dislike-container">
      <button class="like-btn" data-video-id="${val['id']}">Like</button>
      <button class="dislike-btn" data-video-id="${val['id']}">Dislike</button>
      <p class="likes-count" data-video-id="${val['id']}">${val['likes'] || 0}</p>
    </div>
    <h5 class="card-title">${val["title"] || "Untitled"}</h5>
    <p><strong>Uploaded by:</strong> ${val["userName"]} (User ID: ${val["userID"]})</p>
  `);

  videoCard.push(`
    <div class="additional-info" style="display: none;">
      <p><strong>Publisher:</strong> ${val["publisher"] || "N/A"}</p>
      <p><strong>Producer:</strong> ${val["producer"] || "N/A"}</p>
      <p><strong>Genre:</strong> ${val["genre"] || "N/A"}</p>
      <p><strong>Rating:</strong> ${val["rating"] || "N/A"}</p>
      
      <!-- Comment Section -->
      <div class="container mt-5">
          <h3>Comments</h3>
                      <!-- New Load Comments Button -->
        <button type="button" id="loadCommentsBtn-${val['id']}" class="btn btn-primary mt-2">Load Comments</button>
  
          <div id="commentSection-${val['id']}" class="mb-4">
              <!-- Existing Comments will appear here -->
          </div>
        <form id="commentForm-${val['id']}">
            <div class="mb-3">
                <label for="userNameInput" class="form-label">Username:</label>
                <input type="text" class="form-control" id="userNameInput-${val['id']}" placeholder="Enter your username" required>
            </div>
            <div class="mb-3">
                <label for="commentText" class="form-label">Write a Comment:</label>
                <textarea class="form-control" id="commentText-${val['id']}" rows="3" required></textarea>
            </div>
            <button type="button" id="submitCommentBtn-${val['id']}" class="btn btn-primary">Submit Comment</button>
        </form>
      </div>
    </div>
  `);

  videoCard.push(`
    <button class="btn btn-info mt-2 toggle-btn">Show More</button>
  `);

  videoCard.push("</div>");
  videoCard.push("</div>");
  
  // Use event delegation to handle dynamic elements
  $(document).on('click', '[id^="submitCommentBtn-"]', function(e) {
    e.preventDefault();

    // Get the video ID by extracting from the button's ID
    const videoId = $(this).attr('id').split('-')[1];
    
    // Get the comment and username specific to this video
    const commentText = $(`#commentText-${videoId}`).val().trim();
    const userName = $(`#userNameInput-${videoId}`).val().trim();

    if (commentText && userName) {
      // Disable the button to prevent multiple submissions
      // $(`#submitCommentBtn-${videoId}`).prop('disabled', true);

      // Call submitComment with the correct videoId, comment, and username
      submitComment(videoId, commentText, userName).then(() => {
        // Clear the comment and username fields after submission
        $(`#commentText-${videoId}`).val('');
        $(`#userNameInput-${videoId}`).val('');
      }).catch(err => {
        console.error('Error submitting comment:', err);
      });
      
    } else {
      alert('Please fill in both the username and comment fields.');
    }
  });
  console.log(`Loading comments for video ID: ${val['id']}`);

  // Event delegation for loading comments
  $(document).on('click', '[id^="loadCommentsBtn-"]', function(e) {
    e.preventDefault();
    
    const videoId = $(this).attr('id').split('-')[1];
    loadComments(videoId);
    $(this).hide();
  });
  return videoCard.join("");
}

// Function to load comments for a specific video
function loadComments(videoId) {
  console.log("LOAD COMMENTS function called");  // Ensure the function runs

  const commentSection = $(`#commentSection-${videoId}`);
  commentSection.html("<img class='prawn-spinner' src='images/prawn.png' alt='Prawn' />");

  // Fetch comments from the server
  $.getJSON(getComments.replace("{id}", videoId), function(data) {
    if (data.length === 0) {
      commentSection.html("<p>No comments yet.</p>");
      return;
    }

    const comments = data.map(comment => `
      <div class="comment">
        <p><strong>${comment.userName}</strong>: ${comment.comment}</p>
      </div>
    `);

    commentSection.html(comments.join(""));
  }).fail(function(xhr, status, error) {
    commentSection.html("<p>Error loading comments.</p>");
    console.error("Error fetching comments:", error);
  });
}



// Function to submit a new comment for a video
function submitComment(videoId, text, userName) {
  console.log("submitComment function called");  // Ensure the function runs
  console.log("videoId:", videoId, "text:", text, "userName:", userName); // Check value
  const requestBody = {
    comment: text,
    userName: userName,
    videoID: videoId  // Ensure correct property name for video ID
  };

  console.log("Submitting comment:", requestBody);

  $.ajax({
    url: postComments,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestBody),
    success: function(data) {
      console.log("Comment submitted successfully:", data);
      $(`#commentText-${videoId}`).val("");  // Clear the comment input
      $(`#userNameInput-${videoId}`).val(""); // Clear the username input
      loadComments(videoId);  // Refresh the comments section after submission
    },
    error: function(xhr, status, error) {
      console.error("Error submitting comment", xhr.responseText || error);
      alert("Failed to submit comment. Please try again.");
    }
  });
}


