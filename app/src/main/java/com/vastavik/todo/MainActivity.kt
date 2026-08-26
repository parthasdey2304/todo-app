package com.vastavik.todo

import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RectangleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
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

// BRUTAL PALETTE
private val BrutalYellow = Color(0xFFFFE600)
private val BrutalCyan = Color(0xFF22D3EE)
private val BrutalPurple = Color(0xFFA78BFA)
private val BrutalRed = Color(0xFFFF3B30)
private val BrutalBlack = Color(0xFF000000)
private val BrutalWhite = Color(0xFFFFFFFF)
private val BrutalGreen = Color(0xFF22C55E)

class MainActivity : ComponentActivity() {
    
    private val auth: FirebaseAuth by lazy { Firebase.auth }
    private val db = Firebase.firestore
    private var voiceInputResult = mutableStateOf("")

    private val speechRecognizerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val data = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            voiceInputResult.value = data?.get(0) ?: ""
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = BrutalYellow,
                    surface = BrutalWhite,
                    primary = BrutalBlack
                )
            ) {
                MainScreen()
            }
        }
    }

    @Composable
    fun MainScreen() {
        val navController = rememberNavController()
        var selectedDate by remember { mutableStateOf(Date()) }
        var tasks by remember { mutableStateOf(listOf<Task>()) }
        
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
            containerColor = BrutalYellow,
            bottomBar = {
                // BRUTAL BOTTOM BAR — thick border, zero radius, hash strip
                Column {
                    // hash strip
                    Row(Modifier.fillMaxWidth().height(6.dp).background(BrutalWhite).border(2.dp, BrutalBlack)) {
                        Box(Modifier.weight(1f).fillMaxHeight().background(BrutalYellow).border(1.dp, BrutalBlack))
                        Box(Modifier.weight(1f).fillMaxHeight().background(BrutalCyan).border(1.dp, BrutalBlack))
                        Box(Modifier.weight(1f).fillMaxHeight().background(BrutalPurple).border(1.dp, BrutalBlack))
                        Box(Modifier.weight(1f).fillMaxHeight().background(BrutalRed))
                    }
                    NavigationBar(
                        containerColor = BrutalWhite,
                        modifier = Modifier.border(4.dp, BrutalBlack)
                    ) {
                        val navBackStackEntry by navController.currentBackStackEntryAsState()
                        val currentRoute = navBackStackEntry?.destination?.route
                        val items = listOf(
                            Triple("inbox", Icons.Default.Inbox, "INBOX"),
                            Triple("today", Icons.Default.Home, "TODAY"),
                            Triple("settings", Icons.Default.Settings, "SETTINGS")
                        )
                        items.forEach { (route, icon, label) ->
                            val selected = currentRoute == route
                            NavigationBarItem(
                                icon = {
                                    Box(
                                        Modifier.size(32.dp)
                                            .background(if (selected) BrutalYellow else BrutalWhite)
                                            .border(3.dp, BrutalBlack),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(icon, contentDescription = label, tint = BrutalBlack, modifier = Modifier.size(18.dp))
                                    }
                                },
                                label = {
                                    Text(
                                        label,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 10.sp,
                                        color = if (selected) BrutalYellow else BrutalBlack,
                                        letterSpacing = 1.sp
                                    )
                                },
                                selected = selected,
                                onClick = { navController.navigate(route) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = BrutalBlack,
                                    unselectedIconColor = BrutalBlack,
                                    selectedTextColor = BrutalBlack,
                                    unselectedTextColor = BrutalBlack,
                                    indicatorColor = BrutalBlack
                                )
                            )
                        }
                    }
                }
            },
            floatingActionButton = {
                // BRUTAL FAB — square, thick border, shadow
                Box(
                    Modifier
                        .size(64.dp)
                        .background(BrutalBlack)
                        .border(4.dp, BrutalBlack)
                        .clickable { /* TODO */ }
                        .padding(2.dp)
                        .background(BrutalYellow)
                        .border(3.dp, BrutalBlack),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Task", tint = BrutalBlack, modifier = Modifier.size(32.dp))
                }
            }
        ) { paddingValues ->
            NavHost(navController, startDestination = "today", Modifier.padding(paddingValues)) {
                composable("today") {
                    TodayDashboard(tasks, selectedDate, { selectedDate = it }, {
                        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        }
                        speechRecognizerLauncher.launch(intent)
                    })
                }
                composable("inbox") {
                    BrutalEmptyScreen("INBOX", "NO UNSCHEDULED CHAOS", BrutalPurple)
                }
                composable("settings") {
                    BrutalEmptyScreen("SETTINGS", "TUNE THE MACHINE", BrutalCyan)
                }
            }
        }
    }

    @Composable
    fun BrutalEmptyScreen(title: String, subtitle: String, accent: Color) {
        Box(
            Modifier.fillMaxSize().background(BrutalYellow).padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // hash bg card
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(BrutalWhite)
                        .border(4.dp, BrutalBlack)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            Modifier.size(72.dp)
                                .background(accent)
                                .border(4.dp, BrutalBlack),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = BrutalBlack, modifier = Modifier.size(36.dp))
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(title, fontSize = 28.sp, fontWeight = FontWeight.Black, color = BrutalBlack, letterSpacing = (-1).sp)
                        Text(subtitle, fontSize = 11.sp, fontWeight = FontWeight.Black, color = BrutalBlack.copy(alpha=0.6f), letterSpacing = 2.sp)
                        Spacer(Modifier.height(8.dp))
                        Box(Modifier.fillMaxWidth().height(4.dp).background(BrutalBlack))
                        Spacer(Modifier.height(4.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                            Box(Modifier.weight(1f).height(8.dp).background(BrutalYellow).border(2.dp, BrutalBlack))
                            Box(Modifier.weight(1f).height(8.dp).background(BrutalCyan).border(2.dp, BrutalBlack))
                            Box(Modifier.weight(1f).height(8.dp).background(BrutalPurple).border(2.dp, BrutalBlack))
                        }
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
        val displayFormat = SimpleDateFormat("EEEE — MMM d", Locale.getDefault())

        // animated jitter for header
        val infiniteTransition = rememberInfiniteTransition(label = "brutal")
        val jitter by infiniteTransition.animateFloat(
            initialValue = -0.5f, targetValue = 0.5f,
            animationSpec = infiniteRepeatable(tween(120, easing = LinearEasing), RepeatMode.Reverse),
            label = "jitter"
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(BrutalYellow)
                .padding(12.dp)
        ) {
            // HEADER — BRUTAL
            Box(
                Modifier.fillMaxWidth()
                    .background(BrutalWhite)
                    .border(4.dp, BrutalBlack)
                    .padding(12.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("TODAY", fontSize = 22.sp, fontWeight = FontWeight.Black, color = BrutalYellow, letterSpacing = (-1).sp)
                        }
                        Spacer(Modifier.width(8.dp))
                        Box(
                            Modifier.background(BrutalYellow).border(3.dp, BrutalBlack).padding(horizontal = 6.dp, vertical = 4.dp)
                        ) {
                            Text(displayFormat.format(selectedDate).uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Black, color = BrutalBlack, letterSpacing = 1.sp)
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    // stats bar
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Box(Modifier.background(BrutalYellow).border(3.dp, BrutalBlack).padding(horizontal = 8.dp, vertical = 4.dp)) {
                            Text("${activeTasks.size} ACTIVE", fontSize = 10.sp, fontWeight = FontWeight.Black, color = BrutalBlack)
                        }
                        Box(Modifier.background(BrutalBlack).border(3.dp, BrutalBlack).padding(horizontal = 8.dp, vertical = 4.dp)) {
                            Text("BRUTAL MODE ON", fontSize = 10.sp, fontWeight = FontWeight.Black, color = BrutalYellow)
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // Marquee fake
            Box(
                Modifier.fillMaxWidth()
                    .background(BrutalBlack)
                    .border(3.dp, BrutalBlack)
                    .padding(vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("◆ TODAY IS YOURS — MAKE IT BRUTAL — NO SOFT TASKS — ◆", fontSize = 9.sp, fontWeight = FontWeight.Black, color = BrutalYellow, letterSpacing = 1.sp)
            }

            Spacer(Modifier.height(8.dp))

            // WEEK SELECTOR CARD
            Box(
                Modifier.fillMaxWidth()
                    .background(BrutalWhite)
                    .border(4.dp, BrutalBlack)
                    .padding(8.dp)
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.background(BrutalBlack).padding(horizontal = 6.dp, vertical = 2.dp)) {
                            Text("WEEK SELECTOR // PICK YOUR BATTLE", fontSize = 8.sp, fontWeight = FontWeight.Black, color = BrutalYellow, letterSpacing = 1.sp)
                        }
                        Spacer(Modifier.weight(1f))
                        Box(Modifier.background(BrutalYellow).border(2.dp, BrutalBlack).padding(horizontal = 4.dp, vertical = 2.dp)) {
                            Text("7 DAYS", fontSize = 8.sp, fontWeight = FontWeight.Black, color = BrutalBlack)
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    WeeklyDateSelector(selectedDate, onDateSelected)
                }
            }

            Spacer(Modifier.height(10.dp))

            // ADD TASK BAR — BRUTAL
            Box(
                Modifier.fillMaxWidth()
                    .background(BrutalWhite)
                    .border(4.dp, BrutalBlack)
                    .padding(8.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            Modifier.size(40.dp).background(BrutalBlack).border(3.dp, BrutalBlack),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = BrutalYellow, modifier = Modifier.size(22.dp))
                        }
                        Spacer(Modifier.width(8.dp))
                        Box(
                            Modifier.weight(1f)
                                .background(BrutalYellow.copy(alpha = 0.3f))
                                .border(3.dp, BrutalBlack)
                                .padding(horizontal = 10.dp, vertical = 10.dp)
                        ) {
                            Text(
                                text = if (voiceInputResult.value.isNotEmpty()) voiceInputResult.value.uppercase() else "ADD A TASK... MAKE IT LOUD!",
                                color = if (voiceInputResult.value.isNotEmpty()) BrutalBlack else BrutalBlack.copy(alpha = 0.4f),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 0.5.sp
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Box(
                            Modifier.size(44.dp)
                                .background(BrutalWhite)
                                .border(4.dp, BrutalBlack)
                                .clickable { onMicClick() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Mic, contentDescription = "Voice", tint = BrutalBlack, modifier = Modifier.size(20.dp))
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    // pills
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        item {
                            BrutalPill("TODAY", BrutalPurple)
                        }
                        item {
                            BrutalPill("DEADLINE", BrutalWhite)
                        }
                        item {
                            BrutalPill("P1 — URGENT", BrutalRed, textColor = BrutalWhite)
                        }
                        item {
                            BrutalPill("MANGA MODE", BrutalCyan)
                        }
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // TASK LIST
            if (activeTasks.isEmpty()) {
                Box(
                    Modifier.fillMaxWidth()
                        .background(BrutalWhite)
                        .border(4.dp, BrutalBlack)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            Modifier.size(64.dp)
                                .background(BrutalYellow)
                                .border(4.dp, BrutalBlack)
                                .rotate(jitter),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null, tint = BrutalBlack, modifier = Modifier.size(32.dp))
                        }
                        Spacer(Modifier.height(12.dp))
                        Text("ALL CAUGHT UP!", color = BrutalBlack, fontWeight = FontWeight.Black, fontSize = 18.sp, letterSpacing = (-0.5).sp)
                        Text("NO TASKS — GO MAKE NOISE", color = BrutalBlack.copy(alpha = 0.5f), fontWeight = FontWeight.Black, fontSize = 10.sp, letterSpacing = 1.sp)
                        Spacer(Modifier.height(8.dp))
                        Box(Modifier.fillMaxWidth().height(3.dp).background(BrutalBlack))
                    }
                }
            } else {
                // header
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 6.dp)) {
                    Box(Modifier.background(BrutalBlack).padding(horizontal = 8.dp, vertical = 4.dp)) {
                        Text("ACTIVE — ${activeTasks.size}", fontSize = 10.sp, fontWeight = FontWeight.Black, color = BrutalYellow, letterSpacing = 1.sp)
                    }
                    Spacer(Modifier.width(6.dp))
                    Box(Modifier.weight(1f).height(4.dp).background(BrutalBlack))
                }
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(activeTasks) { task ->
                        TaskCardRow(task)
                    }
                }
            }
        }
    }

    @Composable
    fun BrutalPill(text: String, bg: Color, textColor: Color = BrutalBlack) {
        Box(
            Modifier
                .background(bg)
                .border(3.dp, BrutalBlack)
                .padding(horizontal = 10.dp, vertical = 6.dp)
        ) {
            Text(text, fontSize = 10.sp, fontWeight = FontWeight.Black, color = textColor, letterSpacing = 0.5.sp)
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
        val colors = listOf(BrutalWhite, BrutalYellow, BrutalCyan, BrutalPurple, BrutalRed, BrutalWhite, BrutalYellow)

        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(dates) { date ->
                val isSelected = isSameDay(date, selectedDate)
                val dayFormat = SimpleDateFormat("EEE", Locale.getDefault())
                val numFormat = SimpleDateFormat("d", Locale.getDefault())
                val bg = if (isSelected) BrutalBlack else colors[dates.indexOf(date) % colors.size]
                val txtColor = if (isSelected) BrutalYellow else BrutalBlack

                Column(
                    modifier = Modifier
                        .width(56.dp)
                        .height(68.dp)
                        .background(bg)
                        .border(4.dp, BrutalBlack)
                        .clickable { onDateSelected(date) }
                        .rotate(if (isSelected) -1.2f else if (dates.indexOf(date) % 2 == 0) 0.6f else -0.6f),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(dayFormat.format(date).uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Black, color = txtColor.copy(alpha = if (isSelected) 0.8f else 0.6f), letterSpacing = 1.sp)
                    Text(numFormat.format(date), fontSize = 20.sp, fontWeight = FontWeight.Black, color = txtColor)
                    if (isSelected) {
                        Spacer(Modifier.height(2.dp))
                        Box(Modifier.width(16.dp).height(3.dp).background(BrutalYellow))
                    }
                }
            }
        }
    }

    @Composable
    fun TaskCardRow(task: Task) {
        // rotate slightly — deterministic based on order
        val rot = ((task.order % 3) - 1) * 0.4f
        Box(
            Modifier
                .fillMaxWidth()
                .rotate(rot)
                .background(BrutalWhite)
                .border(4.dp, BrutalBlack)
                .padding(0.dp)
        ) {
            Column {
                // top hash strip
                Row(Modifier.fillMaxWidth().height(6.dp)) {
                    Box(Modifier.weight(1f).fillMaxHeight().background(BrutalYellow).border(1.dp, BrutalBlack))
                    Box(Modifier.weight(1f).fillMaxHeight().background(BrutalCyan).border(1.dp, BrutalBlack))
                    Box(Modifier.weight(1f).fillMaxHeight().background(BrutalPurple))
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    // checkbox — square brutal
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(BrutalWhite)
                            .border(3.dp, BrutalBlack)
                            .clickable {
                                val ref = db.collection("tasks").document(task.id)
                                val newStatus = if (task.status == "completed") "active" else "completed"
                                ref.update(mapOf("status" to newStatus))
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (task.status == "completed") {
                            Box(Modifier.fillMaxSize().background(BrutalYellow), contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = BrutalBlack, modifier = Modifier.size(20.dp))
                            }
                        } else {
                            Text("✓", fontSize = 16.sp, fontWeight = FontWeight.Black, color = BrutalBlack)
                        }
                    }
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(
                            task.title.uppercase(),
                            color = BrutalBlack,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = (-0.5).sp,
                            lineHeight = 16.sp
                        )
                        Spacer(Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            if (task.categoryName != null) {
                                Box(Modifier.background(BrutalBlack).border(2.dp, BrutalBlack).padding(horizontal = 6.dp, vertical = 2.dp)) {
                                    Text(task.categoryName.uppercase(), color = BrutalYellow, fontSize = 9.sp, fontWeight = FontWeight.Black, letterSpacing = 0.5.sp)
                                }
                            }
                            val prioColor = when (task.priority) {
                                "low" -> BrutalCyan
                                "medium" -> BrutalYellow
                                "high" -> Color(0xFFFF9A00)
                                "urgent" -> BrutalRed
                                else -> BrutalWhite
                            }
                            if (task.priority != "none") {
                                Box(
                                    Modifier.background(prioColor).border(3.dp, BrutalBlack).padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(task.priority.uppercase(), fontSize = 9.sp, fontWeight = FontWeight.Black, color = if (task.priority == "urgent") BrutalWhite else BrutalBlack)
                                }
                            }
                        }
                        if (task.labels.isNotEmpty()) {
                            Spacer(Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                task.labels.forEach { label ->
                                    Box(Modifier.background(BrutalPurple).border(2.dp, BrutalBlack).padding(horizontal = 4.dp, vertical = 2.dp)) {
                                        Text("#${label.uppercase()}", fontSize = 9.sp, fontWeight = FontWeight.Black, color = BrutalBlack)
                                    }
                                }
                            }
                        }
                    }
                    // more icon — brutal square
                    Box(
                        Modifier.size(32.dp).background(BrutalWhite).border(3.dp, BrutalBlack),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.MoreVert, contentDescription = null, tint = BrutalBlack, modifier = Modifier.size(16.dp))
                    }
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
