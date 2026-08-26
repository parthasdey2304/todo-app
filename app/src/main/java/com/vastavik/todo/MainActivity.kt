package com.vastavik.todo

import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.vastavik.todo.model.Task
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {
    
    private val auth: FirebaseAuth by lazy { Firebase.auth }
    private val db = Firebase.firestore
    
    // Voice Input State
    private var voiceInputResult = mutableStateOf("")

    private val speechRecognizerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val data = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            voiceInputResult.value = data?.get(0) ?: ""
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = Color(0xFF0C1321),
                    surface = Color(0xFF151E2E),
                    primary = Color(0xFF494BD6)
                )
            ) {
                MainScreen()
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun MainScreen() {
        val navController = rememberNavController()
        var selectedDate by remember { mutableStateOf(Date()) }
        var tasks by remember { mutableStateOf(listOf<Task>()) }
        
        // Firestore Listener
        LaunchedEffect(auth.currentUser) {
            val user = auth.currentUser
            if (user != null) {
                db.collection("tasks")
                    .whereEqualTo("userId", user.uid)
                    .addSnapshotListener { snapshot, _ ->
                        if (snapshot != null) {
                            val fetchedTasks = snapshot.documents.mapNotNull { it.toObject(Task::class.java) }
                            tasks = fetchedTasks.sortedByDescending { it.createdAt }
                        }
                    }
            }
        }

        Scaffold(
            bottomBar = {
                NavigationBar(containerColor = Color(0xFF151E2E)) {
                    val navBackStackEntry by navController.currentBackStackEntryAsState()
                    val currentRoute = navBackStackEntry?.destination?.route

                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Inbox, contentDescription = "Inbox") },
                        label = { Text("Inbox") },
                        selected = currentRoute == "inbox",
                        onClick = { navController.navigate("inbox") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF494BD6),
                            unselectedIconColor = Color(0xFF98A6BD)
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Home, contentDescription = "Today") },
                        label = { Text("Today") },
                        selected = currentRoute == "today",
                        onClick = { navController.navigate("today") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF494BD6),
                            unselectedIconColor = Color(0xFF98A6BD)
                        )
                    )
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings") },
                        selected = currentRoute == "settings",
                        onClick = { navController.navigate("settings") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF494BD6),
                            unselectedIconColor = Color(0xFF98A6BD)
                        )
                    )
                }
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { /* Open Add Task Bottom Sheet */ },
                    containerColor = Color(0xFF494BD6)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Task", tint = Color.White)
                }
            }
        ) { paddingValues ->
            NavHost(navController, startDestination = "today", Modifier.padding(paddingValues)) {
                composable("today") {
                    TodayDashboard(tasks, selectedDate, { selectedDate = it }, {
                        // Start Voice Input
                        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        }
                        speechRecognizerLauncher.launch(intent)
                    })
                }
                composable("inbox") {
                    // Inbox implementation
                    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0C1321)), contentAlignment = Alignment.Center) {
                        Text("Inbox", color = Color.White)
                    }
                }
                composable("settings") {
                    Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0C1321)), contentAlignment = Alignment.Center) {
                        Text("Settings", color = Color.White)
                    }
                }
            }
        }
    }

    @Composable
    fun TodayDashboard(
        tasks: List<Task>, 
        selectedDate: Date, 
        onDateSelected: (Date) -> Unit,
        onMicClick: () -> Unit
    ) {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val selectedDateStr = dateFormat.format(selectedDate)
        
        val activeTasks = tasks.filter { it.scheduledDate == selectedDateStr && it.status == "active" }
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0C1321))
                .padding(16.dp)
        ) {
            Text("Today", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(bottom = 16.dp))
            
            // Weekly Date Selector
            WeeklyDateSelector(selectedDate, onDateSelected)
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Add Task Bar with Mic
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF151E2E))
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add", tint = Color(0xFF98A6BD))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (voiceInputResult.value.isNotEmpty()) voiceInputResult.value else "Add a task for this day...", 
                    color = if (voiceInputResult.value.isNotEmpty()) Color.White else Color(0xFF98A6BD),
                    modifier = Modifier.weight(1f)
                )
                IconButton(onClick = onMicClick) {
                    Icon(Icons.Default.Mic, contentDescription = "Voice Input", tint = Color(0xFF98A6BD))
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Task List
            if (activeTasks.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF1E293B), modifier = Modifier.size(64.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("All caught up!", color = Color(0xFFDCE2F6), fontWeight = FontWeight.Medium)
                    }
                }
            } else {
                LazyColumn {
                    items(activeTasks) { task ->
                        TaskCardRow(task)
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                }
            }
        }
    }
    
    @Composable
    fun WeeklyDateSelector(selectedDate: Date, onDateSelected: (Date) -> Unit) {
        val calendar = Calendar.getInstance()
        calendar.time = selectedDate
        calendar.set(Calendar.DAY_OF_WEEK, calendar.firstDayOfWeek)
        
        val dates = mutableListOf<Date>()
        for (i in 0..6) {
            dates.add(calendar.time)
            calendar.add(Calendar.DAY_OF_MONTH, 1)
        }
        
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(dates) { date ->
                val isSelected = isSameDay(date, selectedDate)
                val dayFormat = SimpleDateFormat("EEE", Locale.getDefault())
                val numFormat = SimpleDateFormat("d", Locale.getDefault())
                
                Column(
                    modifier = Modifier
                        .width(60.dp)
                        .height(72.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (isSelected) Color(0xFF494BD6) else Color(0xFF151E2E))
                        .clickable { onDateSelected(date) },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(dayFormat.format(date).uppercase(), fontSize = 12.sp, color = if (isSelected) Color.White.copy(alpha = 0.8f) else Color(0xFF98A6BD))
                    Text(numFormat.format(date), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = if (isSelected) Color.White else Color(0xFFDCE2F6))
                }
            }
        }
    }

    @Composable
    fun TaskCardRow(task: Task) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF151E2E))
                .padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Checkbox placeholder
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color.Transparent)
                    .padding(2.dp)
            ) {
                 Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF98A6BD))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(task.title, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                if (task.categoryName != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(task.categoryName, color = Color(0xFFC0C1FF), fontSize = 12.sp)
                }
            }
        }
    }
    
    private fun isSameDay(date1: Date, date2: Date): Boolean {
        val cal1 = Calendar.getInstance().apply { time = date1 }
        val cal2 = Calendar.getInstance().apply { time = date2 }
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR)
    }
}
